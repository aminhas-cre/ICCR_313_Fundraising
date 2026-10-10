import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { isLimited } from "@/lib/rateLimit";
import { sendEmail, siteUrl } from "@/lib/email";
import { adminPledgeAlert, pledgeConfirmation } from "@/lib/emailTemplates";

export const dynamic = "force-dynamic";
const MAX_PER_PLEDGE = 50;

// Public: a donor pledges N tickets and gets N individually numbered tickets.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return NextResponse.json({ ok: true }); // honeypot: pretend success
  if (await isLimited(req, "pledge", 40)) {
    return NextResponse.json({ error: "Too many pledges from this connection. Please try again in a few minutes." }, { status: 429 });
  }

  const name = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) || null : null;
  const count = Number(body.ticket_count);
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!Number.isInteger(count) || count < 1 || count > MAX_PER_PLEDGE) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_PER_PLEDGE} tickets.` }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  const cfg = await getSettings();

  // One record per email: returning pledgers add tickets to the same record.
  const find = () => sb.from("donors").select("id, full_name, access_token, phone").eq("email", email).maybeSingle();
  let { data: donor } = await find();
  if (!donor) {
    const ins = await sb
      .from("donors")
      .insert({ full_name: name, email, phone, show_public: body.show_public !== false, source: "web" })
      .select("id, full_name, access_token, phone")
      .single();
    if (ins.error?.code === "23505") donor = (await find()).data; // created a moment ago by a double-submit
    else donor = ins.data;
  }
  if (!donor) return NextResponse.json({ error: "Could not save your pledge. Please try again." }, { status: 500 });

  const { data: nums, error } = await sb.rpc("allocate_tickets", { p_donor: donor.id, p_count: count, p_cap: cfg.goal_donors });
  if (error) {
    const left = error.message.match(/^only_(\d+)_left$/);
    if (error.message === "sold_out") {
      return NextResponse.json({ error: `All ${cfg.goal_donors} tickets are taken, alhamdulillah. Thank you!` }, { status: 409 });
    }
    if (left) {
      return NextResponse.json({ error: `Only ${left[1]} ticket${left[1] === "1" ? " is" : "s are"} left. Please choose fewer.` }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save your pledge. Please try again." }, { status: 500 });
  }
  const newTickets = (nums as number[]).slice().sort((a, b) => a - b);

  const [{ data: mine }, { count: issued }] = await Promise.all([
    sb.from("tickets").select("ticket_no").eq("donor_id", donor.id).order("ticket_no"),
    sb.from("tickets").select("ticket_no", { count: "exact", head: true }),
  ]);
  const allTickets = (mine ?? []).map((r) => r.ticket_no as number);

  // Emails are best-effort and no-op until Resend is configured.
  const base = siteUrl(req);
  const confirm = pledgeConfirmation({
    name: donor.full_name,
    newTickets,
    allTickets,
    price: cfg.ticket_price,
    zelleEmail: cfg.zelle_email,
    statusUrl: `${base}/status`,
    shareUrl: base || "/",
  });
  const alert = adminPledgeAlert({
    name: donor.full_name,
    email,
    phone: donor.phone ?? phone,
    newTickets,
    totalHeld: allTickets.length,
    pledgedSoFar: issued ?? allTickets.length,
    goal: cfg.goal_donors,
    adminUrl: `${base}/admin/tickets`,
  });
  const [toDonor] = await Promise.all([
    sendEmail({ to: email, ...confirm }),
    sendEmail({ to: cfg.admin_notify_email, ...alert }),
  ]);

  return NextResponse.json({
    tickets: newTickets,
    all_tickets: allTickets,
    due: newTickets.length * cfg.ticket_price,
    price: cfg.ticket_price,
    zelle_email: cfg.zelle_email,
    emailed: toDonor.ok,
  });
}

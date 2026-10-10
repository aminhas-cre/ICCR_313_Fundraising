import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { parseDonor } from "@/lib/donorInput";

export const dynamic = "force-dynamic";

// Admin: pledgers with their ticket numbers.
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseServerClient();
  const [d, t] = await Promise.all([
    sb.from("donors").select("id, created_at, full_name, email, phone, show_public, notes, source").order("created_at", { ascending: false }),
    sb.from("tickets").select("ticket_no, donor_id, paid").order("ticket_no"),
  ]);
  if (d.error) return NextResponse.json({ error: d.error.message }, { status: 500 });
  const mine = new Map<string, { no: number; paid: boolean }[]>();
  for (const x of t.data ?? []) {
    const arr = mine.get(x.donor_id) ?? [];
    arr.push({ no: x.ticket_no, paid: x.paid });
    mine.set(x.donor_id, arr);
  }
  return NextResponse.json({ donors: (d.data ?? []).map((r) => ({ ...r, tickets: mine.get(r.id) ?? [] })) });
}

// Admin: add a pledge for someone (e.g. taken in person). Email is optional here.
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = parseDonor(body, false);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const count = Number(body.ticket_count);
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return NextResponse.json({ error: "Tickets must be between 1 and 100" }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  const cfg = await getSettings();
  let donorId: string | null = null;
  const email = parsed.data.email as string | null;
  if (email) {
    const { data } = await sb.from("donors").select("id").eq("email", email).maybeSingle();
    donorId = data?.id ?? null;
  }
  if (!donorId) {
    const { data, error } = await sb.from("donors").insert({ ...parsed.data, source: "admin" }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    donorId = data.id;
  }

  const { data: nums, error } = await sb.rpc("allocate_tickets", { p_donor: donorId, p_count: count, p_cap: cfg.goal_donors });
  if (error) {
    const msg = error.message === "sold_out" ? "All tickets are taken." : error.message.replace(/^only_(\d+)_left$/, "Only $1 ticket(s) left.");
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  if (body.mark_paid) {
    await sb
      .from("tickets")
      .update({ paid: true, paid_at: new Date().toISOString(), paid_amount: cfg.ticket_price, pay_method: "other", received_on: new Date().toISOString().slice(0, 10), bank_memo: "Entered as already paid" })
      .in("ticket_no", nums as number[]);
    await sb.from("ticket_events").insert((nums as number[]).map((n) => ({ ticket_no: n, action: "paid", detail: "entered as already paid" })));
  }
  return NextResponse.json({ ok: true, tickets: nums });
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { formatTicket, parseTicket } from "@/lib/tickets";
import { isLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public: a donor creates their own pledge and gets an ICCR ticket number.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return NextResponse.json({ ok: true }); // honeypot: pretend success
  if (await isLimited(req, "pledge", 5)) {
    return NextResponse.json({ error: "Too many pledges from this connection. Please try again in a few minutes." }, { status: 429 });
  }

  const name = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) || null : null;
  const tickets = Number(body.ticket_count);
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!Number.isInteger(tickets) || tickets < 1 || tickets > 10) {
    return NextResponse.json({ error: "Tickets must be between 1 and 10." }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  let referred_by: string | null = null;
  const refNo = parseTicket(body.ref);
  if (refNo) {
    const { data } = await sb.from("donors").select("id").eq("ticket_no", refNo).maybeSingle();
    referred_by = data?.id ?? null;
  }

  const { data, error } = await sb
    .from("donors")
    .insert({
      full_name: name,
      email,
      phone,
      ticket_count: tickets,
      referred_by,
      show_public: Boolean(body.show_public),
      source: "web",
    })
    .select("ticket_no, access_token, ticket_count")
    .single();
  if (error || !data) return NextResponse.json({ error: "Could not save your pledge. Please try again." }, { status: 500 });

  const cfg = await getSettings();
  return NextResponse.json({
    ticket: formatTicket(data.ticket_no),
    token: data.access_token,
    due: data.ticket_count * cfg.ticket_price,
    zelle_email: cfg.zelle_email,
  });
}

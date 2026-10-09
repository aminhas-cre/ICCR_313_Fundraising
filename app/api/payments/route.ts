import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { parseTicket, formatTicket } from "@/lib/tickets";
import { summarize, syncStatus } from "@/lib/payments";
import { PAYMENT_METHODS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseServerClient();
  const { data, error } = await sb
    .from("payments")
    .select("id, created_at, amount, method, received_on, memo, reference, voided_at, donors(full_name, ticket_no)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payments: data });
}

// Record a payment against a pledge, by ICCR ticket number.
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  const no = parseTicket(b.ticket);
  if (!no) return NextResponse.json({ error: "Enter a ticket number like ICCR-0042." }, { status: 400 });
  const amount = Number(b.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > 1_000_000) {
    return NextResponse.json({ error: "Amount must be a whole dollar amount." }, { status: 400 });
  }
  const method = PAYMENT_METHODS.find((m) => m === b.method);
  if (!method) return NextResponse.json({ error: "Pick a payment method." }, { status: 400 });
  const received_on =
    typeof b.received_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.received_on)
      ? b.received_on
      : new Date().toISOString().slice(0, 10);
  const memo = typeof b.memo === "string" ? b.memo.trim().slice(0, 300) || null : null;
  const reference = typeof b.reference === "string" ? b.reference.trim().slice(0, 100) || null : null;

  const sb = getSupabaseServerClient();
  const { data: donor } = await sb.from("donors").select("id, full_name, ticket_count").eq("ticket_no", no).maybeSingle();
  if (!donor) return NextResponse.json({ error: `No pledge found for ${formatTicket(no)}.` }, { status: 404 });

  const { error } = await sb
    .from("payments")
    .insert({ donor_id: donor.id, amount, method, received_on, memo, reference });
  if (error) {
    const dup = error.code === "23505";
    return NextResponse.json({ error: dup ? "That payment reference was already recorded." : error.message }, { status: dup ? 409 : 500 });
  }
  await syncStatus(donor.id);

  const [{ data: pays }, cfg] = await Promise.all([
    sb.from("payments").select("amount").eq("donor_id", donor.id).is("voided_at", null),
    getSettings(),
  ]);
  return NextResponse.json({
    ok: true,
    donor: donor.full_name,
    ticket: formatTicket(no),
    ...summarize(donor.ticket_count, cfg.ticket_price, pays ?? []),
  });
}

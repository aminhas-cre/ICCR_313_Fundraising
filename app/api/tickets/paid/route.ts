import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { formatTicket, parseTicketList } from "@/lib/tickets";
import { PAYMENT_METHODS } from "@/lib/types";
import { sendEmail } from "@/lib/email";
import { buildReceipt } from "@/lib/receipt";

export const dynamic = "force-dynamic";

// Admin: mark tickets paid (or unpaid) by number, e.g. "ICCR-2, 3, 5-9".
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  const parsed = parseTicketList(typeof b.tickets === "number" ? String(b.tickets) : b.tickets);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const paid = b.paid !== false;
  const method = PAYMENT_METHODS.find((m) => m === b.method) ?? "zelle";
  const received_on =
    typeof b.received_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.received_on)
      ? b.received_on
      : new Date().toISOString().slice(0, 10);
  const memo = typeof b.memo === "string" ? b.memo.trim().slice(0, 300) || null : null;

  const sb = getSupabaseServerClient();
  const cfg = await getSettings();

  const { data: existing, error: readErr } = await sb
    .from("tickets")
    .select("ticket_no, paid, donor_id, donors(full_name, email)")
    .in("ticket_no", parsed.numbers);
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  const found = new Map((existing ?? []).map((t: any) => [t.ticket_no as number, t]));
  const missing = parsed.numbers.filter((n) => !found.has(n));
  if (missing.length === parsed.numbers.length) {
    return NextResponse.json({ error: `No pledged tickets match: ${missing.map(formatTicket).join(", ")}` }, { status: 404 });
  }
  // Only touch tickets whose state actually changes.
  const targets = parsed.numbers.filter((n) => found.has(n) && found.get(n).paid !== paid);
  const unchanged = parsed.numbers.filter((n) => found.has(n) && found.get(n).paid === paid);

  if (targets.length > 0) {
    const patch = paid
      ? { paid: true, paid_at: new Date().toISOString(), paid_amount: cfg.ticket_price, pay_method: method, received_on, bank_memo: memo }
      : { paid: false, paid_at: null, paid_amount: null, pay_method: null, received_on: null, bank_memo: null };
    const { error } = await sb.from("tickets").update(patch).in("ticket_no", targets);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await sb.from("ticket_events").insert(
      targets.map((n) => ({ ticket_no: n, action: paid ? "paid" : "unpaid", detail: paid ? `${method}${memo ? `: ${memo}` : ""}` : null }))
    );
  }

  // Receipts: one email per pledger covering the tickets just marked paid.
  let emailed = 0;
  if (paid && targets.length > 0) {
    const byDonor = new Map<string, { name: string; email: string | null; nums: number[] }>();
    for (const n of targets) {
      const t = found.get(n);
      const d: { name: string; email: string | null; nums: number[] } =
        byDonor.get(t.donor_id) ?? { name: t.donors?.full_name ?? "Friend", email: t.donors?.email ?? null, nums: [] };
      d.nums.push(n);
      byDonor.set(t.donor_id, d);
    }
    const results = await Promise.all(
      [...byDonor.values()]
        .filter((d) => d.email)
        .map((d) =>
          sendEmail({
            to: d.email!,
            ...buildReceipt({
              name: d.name,
              tickets: d.nums.map(formatTicket),
              amount: d.nums.length * cfg.ticket_price,
              method,
              received_on,
              legal_name: cfg.legal_name,
              ein: cfg.ein,
              receipt_statement: cfg.receipt_statement,
            }),
          })
        )
    );
    emailed = results.filter((r) => r.ok).length;
  }

  return NextResponse.json({ ok: true, updated: targets, unchanged, missing, emailed });
}

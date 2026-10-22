import { getSupabaseServerClient } from "./supabase";
import { getSettings } from "./settings";
import { formatTicket } from "./tickets";
import { sendEmail } from "./email";
import { buildReceipt } from "./receipt";
import type { PaymentMethod } from "./types";

export interface MarkPaidResult {
  updated: number[];
  unchanged: number[]; // already in the requested state
  missing: number[];
  emailed: number;
}

// Single path for "this ticket was paid" (admin Zelle entry and Stripe webhook).
// Only tickets whose state changes are touched, so retries are safe.
export async function markTickets(
  numbers: number[],
  paid: boolean,
  opts: {
    method?: PaymentMethod;
    received_on?: string;
    memo?: string | null;
    eventDetail?: string;
    paidBy?: { name?: string | null; email?: string | null }; // who actually paid (from Stripe)
    stripePaymentId?: string | null;
  } = {}
): Promise<MarkPaidResult> {
  const sb = getSupabaseServerClient();
  const cfg = await getSettings();
  const method = opts.method ?? "zelle";
  const received_on = opts.received_on ?? new Date().toISOString().slice(0, 10);
  const memo = opts.memo ?? null;

  const { data: existing, error: readErr } = await sb
    .from("tickets")
    .select("ticket_no, paid, donor_id, donors(full_name, email)")
    .in("ticket_no", numbers);
  if (readErr) throw new Error(readErr.message);
  const found = new Map((existing ?? []).map((t: any) => [t.ticket_no as number, t]));
  const missing = numbers.filter((n) => !found.has(n));
  const targets = numbers.filter((n) => found.has(n) && found.get(n).paid !== paid);
  const unchanged = numbers.filter((n) => found.has(n) && found.get(n).paid === paid);

  if (targets.length > 0) {
    const patch = paid
      ? {
          paid: true,
          paid_at: new Date().toISOString(),
          paid_amount: cfg.ticket_price,
          pay_method: method,
          received_on,
          bank_memo: memo,
          paid_by_name: opts.paidBy?.name?.trim().slice(0, 120) || null,
          paid_by_email: opts.paidBy?.email?.trim().toLowerCase().slice(0, 200) || null,
          stripe_payment_id: opts.stripePaymentId ?? null,
        }
      : { paid: false, paid_at: null, paid_amount: null, pay_method: null, received_on: null, bank_memo: null, paid_by_name: null, paid_by_email: null, stripe_payment_id: null };
    const { error } = await sb.from("tickets").update(patch).in("ticket_no", targets);
    if (error) throw new Error(error.message);
    await sb.from("ticket_events").insert(
      targets.map((n) => ({
        ticket_no: n,
        action: paid ? "paid" : "unpaid",
        detail: paid ? opts.eventDetail ?? `${method}${memo ? `: ${memo}` : ""}` : null,
      }))
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
    // Each donor's full picture (after the update) for the "your pledges" line in the receipt.
    const { data: held } = await sb.from("tickets").select("ticket_no, paid, donor_id").in("donor_id", [...byDonor.keys()]);
    const mine = (id: string) => (held ?? []).filter((t: any) => t.donor_id === id);
    const results = await Promise.all(
      [...byDonor.entries()]
        .map(([id, d]) => ({ ...d, id }))
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
              paidByName: opts.paidBy?.name ?? null,
              reference: opts.stripePaymentId ?? null,
              paidTotal: mine(d.id).filter((t: any) => t.paid).length,
              stillOpen: mine(d.id).filter((t: any) => !t.paid).map((t: any) => formatTicket(t.ticket_no)),
            }),
          })
        )
    );
    emailed = results.filter((r) => r.ok).length;
  }
  return { updated: targets, unchanged, missing, emailed };
}

import { getSupabaseServerClient } from "./supabase";
import { getSettings } from "./settings";
import type { PledgeStatus } from "./types";

export function summarize(ticketCount: number, price: number, payments: { amount: number }[]) {
  const due = ticketCount * price;
  const paid = payments.reduce((n, p) => n + p.amount, 0);
  const status: PledgeStatus = paid >= due ? "paid" : paid > 0 ? "partial" : "pledged";
  return { due, paid, balance: Math.max(0, due - paid), status };
}

// Keeps donors.status / paid_at in step with the payments ledger.
export async function syncStatus(donorId: string) {
  const sb = getSupabaseServerClient();
  const [{ data: donor }, { data: pays }, cfg] = await Promise.all([
    sb.from("donors").select("ticket_count").eq("id", donorId).maybeSingle(),
    sb.from("payments").select("amount").eq("donor_id", donorId).is("voided_at", null),
    getSettings(),
  ]);
  if (!donor) return;
  const s = summarize(donor.ticket_count, cfg.ticket_price, pays ?? []);
  await sb
    .from("donors")
    .update({
      status: s.status === "paid" ? "paid" : "pledged",
      paid_at: s.status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", donorId);
}

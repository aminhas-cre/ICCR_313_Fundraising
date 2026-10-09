import { getSupabaseServerClient } from "./supabase";
import type { Settings } from "./settings";

export interface Stats {
  paidAmount: number;
  pledgedAmount: number; // still outstanding
  goalAmount: number;
  paidTickets: number; // ticket-equivalents, floor(amount / price)
  pledgedTickets: number;
  leaders: { name: string; brought: number }[];
  supporters: { name: string; tickets: number; paid: boolean }[];
}

// Public-safe: only first name + last initial ever leave this function.
function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export async function getStats(s: Settings): Promise<Stats> {
  const sb = getSupabaseServerClient();
  const [d, p] = await Promise.all([
    sb
      .from("donors")
      .select("id, full_name, ticket_count, referred_by, show_public, created_at")
      .order("created_at", { ascending: false }),
    sb.from("payments").select("donor_id, amount").is("voided_at", null),
  ]);
  if (d.error) throw d.error;
  if (p.error) throw p.error;
  const rows = d.data ?? [];

  const received = new Map<string, number>();
  for (const x of p.data ?? []) received.set(x.donor_id, (received.get(x.donor_id) ?? 0) + x.amount);

  let paidTotal = 0, outstanding = 0;
  const fullyPaid = new Set<string>();
  const brought = new Map<string, number>();
  for (const r of rows) {
    const due = r.ticket_count * s.ticket_price;
    const got = received.get(r.id) ?? 0;
    paidTotal += got;
    outstanding += Math.max(0, due - got);
    if (got >= due) {
      fullyPaid.add(r.id);
      if (r.referred_by) brought.set(r.referred_by, (brought.get(r.referred_by) ?? 0) + 1);
    }
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  const leaders = [...brought.entries()]
    .map(([id, n]) => ({ d: byId.get(id), n }))
    .filter((x) => x.d && x.d.show_public)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((x) => ({ name: shortName(x.d!.full_name), brought: x.n }));

  const supporters = rows
    .filter((r) => r.show_public)
    .slice(0, 8)
    .map((r) => ({ name: shortName(r.full_name), tickets: r.ticket_count, paid: fullyPaid.has(r.id) }));

  const paidAmount = paidTotal + s.adjust_paid_amount;
  const pledgedAmount = outstanding + s.adjust_pledged_amount;
  return {
    paidAmount,
    pledgedAmount,
    goalAmount: s.goal_donors * s.ticket_price,
    paidTickets: Math.floor(paidAmount / s.ticket_price),
    pledgedTickets: Math.floor(pledgedAmount / s.ticket_price),
    leaders,
    supporters,
  };
}

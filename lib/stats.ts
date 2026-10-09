import { getSupabaseServerClient } from "./supabase";
import type { Settings } from "./settings";

export interface Stats {
  paidAmount: number;
  pledgedAmount: number;
  goalAmount: number;
  paidTickets: number; // ticket-equivalents, floor(amount / price)
  pledgedTickets: number;
  leaders: { name: string; brought: number }[];
}

// Public-safe: only first name + last initial ever leave this function.
function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export async function getStats(s: Settings): Promise<Stats> {
  const { data, error } = await getSupabaseServerClient()
    .from("donors")
    .select("id, full_name, ticket_count, status, referred_by, show_public");
  if (error) throw error;
  const rows = data ?? [];

  let paidDonorTickets = 0, pledgedDonorTickets = 0;
  const brought = new Map<string, number>();
  for (const r of rows) {
    if (r.status === "paid") {
      paidDonorTickets += r.ticket_count;
      if (r.referred_by) brought.set(r.referred_by, (brought.get(r.referred_by) ?? 0) + 1);
    } else {
      pledgedDonorTickets += r.ticket_count;
    }
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  const leaders = [...brought.entries()]
    .map(([id, n]) => ({ d: byId.get(id), n }))
    .filter((x) => x.d && x.d.show_public)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((x) => ({ name: shortName(x.d!.full_name), brought: x.n }));

  const paidAmount = paidDonorTickets * s.ticket_price + s.adjust_paid_amount;
  const pledgedAmount = pledgedDonorTickets * s.ticket_price + s.adjust_pledged_amount;
  return {
    paidAmount,
    pledgedAmount,
    goalAmount: s.goal_donors * s.ticket_price,
    paidTickets: Math.floor(paidAmount / s.ticket_price),
    pledgedTickets: Math.floor(pledgedAmount / s.ticket_price),
    leaders,
  };
}

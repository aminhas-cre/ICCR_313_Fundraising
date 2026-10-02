import { getSupabaseServerClient } from "./supabase";
import { TICKET_PRICE } from "./constants";

export interface Stats {
  paidTickets: number;
  pledgedTickets: number;
  paidAmount: number;
  pledgedAmount: number;
  paidDonors: number;
  leaders: { name: string; brought: number }[];
}

// Public-safe: only first name + last initial ever leave this function.
function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export async function getStats(): Promise<Stats> {
  const { data, error } = await getSupabaseServerClient()
    .from("donors")
    .select("id, full_name, ticket_count, status, referred_by, show_public");
  if (error) throw error;
  const rows = data ?? [];

  let paidTickets = 0, pledgedTickets = 0, paidDonors = 0;
  const brought = new Map<string, number>();
  for (const r of rows) {
    if (r.status === "paid") {
      paidTickets += r.ticket_count;
      paidDonors += 1;
      if (r.referred_by) brought.set(r.referred_by, (brought.get(r.referred_by) ?? 0) + 1);
    } else {
      pledgedTickets += r.ticket_count;
    }
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  const leaders = [...brought.entries()]
    .map(([id, n]) => ({ d: byId.get(id), n }))
    .filter((x) => x.d && x.d.show_public)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((x) => ({ name: shortName(x.d!.full_name), brought: x.n }));

  return {
    paidTickets,
    pledgedTickets,
    paidAmount: paidTickets * TICKET_PRICE,
    pledgedAmount: pledgedTickets * TICKET_PRICE,
    paidDonors,
    leaders,
  };
}

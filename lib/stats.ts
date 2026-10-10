import { getSupabaseServerClient } from "./supabase";
import type { Settings } from "./settings";

export interface Stats {
  goalTickets: number;
  goalAmount: number;
  issued: number; // ticket numbers handed out so far
  numbersLeft: number;
  pledgedTickets: number; // everything pledged, paid or not
  paidTickets: number;
  pledgedAmount: number; // includes paid
  paidAmount: number;
  supporters: { name: string; count: number }[];
}

// Public-safe: only first name + last initial ever leave this function.
export function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export async function getStats(s: Settings): Promise<Stats> {
  const sb = getSupabaseServerClient();
  const [t, d] = await Promise.all([
    sb.from("tickets").select("donor_id, paid, created_at"),
    sb.from("donors").select("id, full_name, show_public"),
  ]);
  if (t.error) throw t.error;
  if (d.error) throw d.error;
  const tickets = t.data ?? [];

  const issued = tickets.length;
  const paidCount = tickets.filter((x) => x.paid).length;

  // Offline adjustments (cash, etc.) count toward both thermometers.
  const paidAmount = paidCount * s.ticket_price + s.adjust_paid_amount;
  const pledgedAmount = issued * s.ticket_price + s.adjust_paid_amount + s.adjust_pledged_amount;

  const by = new Map<string, { count: number; latest: string }>();
  for (const x of tickets) {
    const cur = by.get(x.donor_id) ?? { count: 0, latest: "" };
    cur.count += 1;
    if (x.created_at > cur.latest) cur.latest = x.created_at;
    by.set(x.donor_id, cur);
  }
  const donors = new Map((d.data ?? []).map((r) => [r.id, r]));
  const supporters = [...by.entries()]
    .sort((a, b) => (a[1].latest < b[1].latest ? 1 : -1))
    .map(([id, v]) => {
      const dn = donors.get(id);
      return { name: dn && dn.show_public ? shortName(dn.full_name) : "Anonymous", count: v.count };
    });

  return {
    goalTickets: s.goal_donors,
    goalAmount: s.goal_donors * s.ticket_price,
    issued,
    numbersLeft: Math.max(0, s.goal_donors - issued),
    pledgedTickets: Math.floor(pledgedAmount / s.ticket_price),
    paidTickets: Math.floor(paidAmount / s.ticket_price),
    pledgedAmount,
    paidAmount,
    supporters,
  };
}

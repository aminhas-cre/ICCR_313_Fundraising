import { getSupabaseServerClient } from "./supabase";
import { GOAL_DONORS, TICKET_PRICE, ZELLE_EMAIL, ZELLE_NOTE } from "./constants";

export interface Settings {
  goal_donors: number;
  ticket_price: number;
  zelle_email: string;
  zelle_note: string;
  adjust_paid_amount: number;
  adjust_pledged_amount: number;
  adjust_note: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  goal_donors: GOAL_DONORS,
  ticket_price: TICKET_PRICE,
  zelle_email: ZELLE_EMAIL,
  zelle_note: ZELLE_NOTE,
  adjust_paid_amount: 0,
  adjust_pledged_amount: 0,
  adjust_note: null,
};

// Never throws: the public page must keep rendering even if the row is missing.
export async function getSettings(): Promise<Settings> {
  try {
    const { data } = await getSupabaseServerClient()
      .from("campaign_settings")
      .select("goal_donors, ticket_price, zelle_email, zelle_note, adjust_paid_amount, adjust_pledged_amount, adjust_note")
      .eq("id", 1)
      .maybeSingle();
    return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function parseSettings(body: any): { data: Settings } | { error: string } {
  const int = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };
  const goal = int(body.goal_donors, 1, 10000);
  const price = int(body.ticket_price, 1, 100000);
  const paidAdj = int(body.adjust_paid_amount, 0, 10_000_000);
  const pledgedAdj = int(body.adjust_pledged_amount, 0, 10_000_000);
  if (goal === null) return { error: "Goal must be a whole number 1-10,000" };
  if (price === null) return { error: "Ticket price must be a whole dollar amount" };
  if (paidAdj === null || pledgedAdj === null) return { error: "Adjustments must be whole dollars, 0 or more" };

  const email = typeof body.zelle_email === "string" ? body.zelle_email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid Zelle email" };
  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  return {
    data: {
      goal_donors: goal,
      ticket_price: price,
      zelle_email: email,
      zelle_note: clip(body.zelle_note, 200),
      adjust_paid_amount: paidAdj,
      adjust_pledged_amount: pledgedAdj,
      adjust_note: clip(body.adjust_note, 200) || null,
    },
  };
}

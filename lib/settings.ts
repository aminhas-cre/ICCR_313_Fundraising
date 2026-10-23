import { getSupabaseServerClient } from "./supabase";
import { GOAL_DONORS, TICKET_PRICE, LAUNCHGOOD_URL, VENMO_HANDLE, ZELLE_EMAIL, ZELLE_NOTE } from "./constants";

export interface Settings {
  goal_donors: number;
  ticket_price: number;
  zelle_email: string;
  zelle_note: string;
  venmo_handle: string; // without the @; empty hides Venmo
  launchgood_url: string; // empty hides LaunchGood
  adjust_paid_amount: number;
  adjust_pledged_amount: number;
  adjust_note: string | null;
  // Receipts only: never rendered on public pages.
  legal_name: string;
  ein: string;
  receipt_statement: string;
  admin_notify_email: string;
}

export const DEFAULT_RECEIPT_STATEMENT =
  "{legal_name} is a 501(c)(3) nonprofit organization. No goods or services were provided in exchange for this donation. Please keep this receipt for your records.";

export const DEFAULT_SETTINGS: Settings = {
  goal_donors: GOAL_DONORS,
  ticket_price: TICKET_PRICE,
  zelle_email: ZELLE_EMAIL,
  zelle_note: ZELLE_NOTE,
  venmo_handle: VENMO_HANDLE,
  launchgood_url: LAUNCHGOOD_URL,
  adjust_paid_amount: 0,
  adjust_pledged_amount: 0,
  adjust_note: null,
  legal_name: "Islamic Center of Castle Rock",
  ein: "99-2085129",
  receipt_statement: DEFAULT_RECEIPT_STATEMENT,
  admin_notify_email: "islamiccentercastlerock@gmail.com",
};

// Never throws: the public page must keep rendering even if the row is missing.
export async function getSettings(): Promise<Settings> {
  try {
    const { data } = await getSupabaseServerClient()
      .from("campaign_settings")
      .select("goal_donors, ticket_price, zelle_email, zelle_note, venmo_handle, launchgood_url, adjust_paid_amount, adjust_pledged_amount, adjust_note, legal_name, ein, receipt_statement, admin_notify_email")
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
  const venmo = (typeof body.venmo_handle === "string" ? body.venmo_handle.trim() : "").replace(/^@/, "");
  if (venmo && !/^[A-Za-z0-9_-]{3,30}$/.test(venmo)) return { error: "Venmo handle should be letters, numbers, - or _ (like ICCR1)" };
  const lg = typeof body.launchgood_url === "string" ? body.launchgood_url.trim() : "";
  if (lg) {
    let ok = false;
    try { const u = new URL(lg); ok = u.protocol === "https:" && /(^|\.)launchgood\.com$/.test(u.hostname); } catch {}
    if (!ok) return { error: "LaunchGood link must be an https://www.launchgood.com/... address (or empty to hide it)" };
  }
  const legalName = typeof body.legal_name === "string" ? body.legal_name.trim() : "";
  if (!legalName || legalName.length > 120) return { error: "Enter the organization's legal name (up to 120 characters)" };
  const ein = typeof body.ein === "string" ? body.ein.trim() : "";
  if (!/^\d{2}-\d{7}$/.test(ein)) return { error: "EIN must look like 12-3456789" };
  const statement = typeof body.receipt_statement === "string" ? body.receipt_statement.trim() : "";
  if (!statement || statement.length > 600) return { error: "Receipt statement is required (up to 600 characters)" };
  const notify = typeof body.admin_notify_email === "string" ? body.admin_notify_email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notify)) return { error: "Enter a valid email for pledge alerts" };
  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  return {
    data: {
      goal_donors: goal,
      ticket_price: price,
      zelle_email: email,
      zelle_note: clip(body.zelle_note, 200),
      venmo_handle: venmo,
      launchgood_url: lg,
      adjust_paid_amount: paidAdj,
      adjust_pledged_amount: pledgedAdj,
      adjust_note: clip(body.adjust_note, 200) || null,
      legal_name: legalName,
      ein,
      receipt_statement: statement,
      admin_notify_email: notify,
    },
  };
}

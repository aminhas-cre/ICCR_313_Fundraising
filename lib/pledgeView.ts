import { getSupabaseServerClient } from "./supabase";
import { getSettings } from "./settings";
import { formatTicket } from "./tickets";
import { summarize } from "./payments";
import type { Donor, PledgeView } from "./types";

export async function loadView(
  by: { ticket_no: number } | { token: string }
): Promise<{ donor: Donor; view: PledgeView } | null> {
  const sb = getSupabaseServerClient();
  const base = sb.from("donors").select("*");
  const { data } =
    "token" in by
      ? by.token.length >= 20
        ? await base.eq("access_token", by.token).maybeSingle()
        : { data: null }
      : await base.eq("ticket_no", by.ticket_no).maybeSingle();
  if (!data) return null;
  const donor = data as Donor;

  const [{ data: pays }, cfg] = await Promise.all([
    sb
      .from("payments")
      .select("amount, method, received_on")
      .eq("donor_id", donor.id)
      .is("voided_at", null)
      .order("received_on"),
    getSettings(),
  ]);
  const payments = pays ?? [];
  const s = summarize(donor.ticket_count, cfg.ticket_price, payments);
  return {
    donor,
    view: {
      ticket: formatTicket(donor.ticket_no),
      name: donor.full_name,
      tickets: donor.ticket_count,
      ...s,
      payments,
      token: donor.access_token,
      zelle_email: cfg.zelle_email,
      ticket_price: cfg.ticket_price,
    },
  };
}

import { getSupabaseServerClient } from "./supabase";
import { getSettings } from "./settings";
import type { PledgeView } from "./types";

async function build(donor: { id: string; full_name: string; access_token: string }): Promise<PledgeView> {
  const sb = getSupabaseServerClient();
  const [{ data: rows }, cfg] = await Promise.all([
    sb
      .from("tickets")
      .select("ticket_no, paid, received_on, passed_on, passed_to")
      .eq("donor_id", donor.id)
      .order("ticket_no"),
    getSettings(),
  ]);
  return {
    name: donor.full_name,
    token: donor.access_token,
    zelle_email: cfg.zelle_email,
    ticket_price: cfg.ticket_price,
    tickets: (rows ?? []).map((t) => ({
      no: t.ticket_no,
      paid: t.paid,
      received_on: t.received_on,
      passed_on: t.passed_on,
      passed_to: t.passed_to,
    })),
  };
}

export async function loadByEmail(email: string): Promise<PledgeView | null> {
  const { data } = await getSupabaseServerClient()
    .from("donors")
    .select("id, full_name, access_token")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data ? build(data) : null;
}

export async function loadByToken(token: string): Promise<PledgeView | null> {
  if (token.length < 20) return null;
  const { data } = await getSupabaseServerClient()
    .from("donors")
    .select("id, full_name, access_token")
    .eq("access_token", token)
    .maybeSingle();
  return data ? build(data) : null;
}

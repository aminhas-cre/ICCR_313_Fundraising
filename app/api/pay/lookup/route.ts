import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { isLimited } from "@/lib/rateLimit";
import { parseTicketList } from "@/lib/tickets";
import { shortName } from "@/lib/stats";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Public: which of these ticket numbers can be paid by card? Reveals only the
// pledger's first name + last initial (or "a supporter" if they chose anonymity).
export async function POST(req: Request) {
  if (await isLimited(req, "paylookup", 40)) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  }
  const b = await req.json().catch(() => ({}));
  const parsed = parseTicketList(b.tickets, 50);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const sb = getSupabaseServerClient();
  const { data } = await sb.from("tickets").select("ticket_no, paid, donors(full_name, show_public)").in("ticket_no", parsed.numbers);
  const cfg = await getSettings();
  const rows = ((data ?? []) as any[]).map((t) => ({
    no: t.ticket_no as number,
    paid: Boolean(t.paid),
    owner: t.donors?.show_public ? shortName(t.donors.full_name) : "a supporter",
  }));
  const found = new Set(rows.map((r) => r.no));
  return NextResponse.json({
    tickets: rows,
    notFound: parsed.numbers.filter((n) => !found.has(n)),
    price: cfg.ticket_price,
    card_enabled: stripeConfigured(),
  });
}

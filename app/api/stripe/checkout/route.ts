import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { isLimited } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/email";
import { formatTicket } from "@/lib/tickets";
import { feeCents } from "@/lib/fee";
import { createCheckoutSession, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";
const MAX_TICKETS = 50;

// Public: start a card / Apple Pay / debit checkout for specific unpaid tickets.
// The amount is always recomputed here; the browser never sets the price.
export async function POST(req: Request) {
  if (!stripeConfigured()) return NextResponse.json({ error: "Card payments aren't available yet." }, { status: 503 });
  if (await isLimited(req, "checkout", 20)) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  }
  const b = await req.json().catch(() => ({}));
  const nums: number[] = Array.isArray(b.tickets)
    ? Array.from(new Set<number>(b.tickets.map((x: unknown) => Number(x)))).filter((n) => Number.isInteger(n) && n >= 1 && n <= 10000).sort((a, c) => a - c)
    : [];
  if (nums.length === 0 || nums.length > MAX_TICKETS) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_TICKETS} tickets.` }, { status: 400 });
  }

  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from("tickets").select("ticket_no, paid, donors(full_name)").in("ticket_no", nums);
  if (error) return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  const rows = new Map((data ?? []).map((r) => [r.ticket_no as number, r]));
  const unknown = nums.filter((n) => !rows.has(n));
  if (unknown.length) return NextResponse.json({ error: `${unknown.map(formatTicket).join(", ")} hasn't been pledged yet.` }, { status: 404 });
  const paid = nums.filter((n) => rows.get(n)!.paid);
  if (paid.length) return NextResponse.json({ error: `${paid.map(formatTicket).join(", ")} is already paid.` }, { status: 409 });

  const cfg = await getSettings();
  const base = siteUrl(req);
  const per = cfg.ticket_price * 100;
  try {
    const session = await createCheckoutSession({
      tickets: nums,
      pricePerTicketCents: per,
      feeCents: b.coverFee ? feeCents(per * nums.length) : 0,
      pledgers: Array.from(new Set((data ?? []).map((r: any) => String(r.donors?.full_name ?? "").trim()).filter(Boolean))).join(", ").slice(0, 400),
      successUrl: `${base}/thanks`,
      cancelUrl: `${base}/pay?t=${nums.join(",")}&canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Could not start the card checkout. Please try again, or pay by Zelle." }, { status: 502 });
  }
}

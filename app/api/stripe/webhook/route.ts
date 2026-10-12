import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { markTickets } from "@/lib/markPaid";
import { formatTicket } from "@/lib/tickets";
import { verifyWebhook } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe -> us. Marks the tickets in a paid Checkout Session as paid (card).
// Retried deliveries are safe: only tickets that aren't already paid change.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const type = event?.type;
  if (type !== "checkout.session.completed" && type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ ok: true, ignored: type });
  }
  const s = event.data?.object ?? {};
  if (s.payment_status !== "paid") return NextResponse.json({ ok: true, ignored: "not paid yet" });

  const numbers = String(s.metadata?.tickets ?? "")
    .split(",")
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (numbers.length === 0) return NextResponse.json({ ok: true, ignored: "no tickets" });

  const ref = typeof s.payment_intent === "string" ? s.payment_intent : s.id;
  try {
    const r = await markTickets(numbers, true, { method: "card", memo: `stripe ${ref}`, eventDetail: `card: stripe ${ref}` });
    // A *different* payment landing on an already-paid ticket (e.g. Zelle arrived first): flag it for a refund.
    // A retry of this same payment is recognised by its memo and stays silent.
    if (r.unchanged.length > 0) {
      const sb = getSupabaseServerClient();
      const { data: rows } = await sb.from("tickets").select("ticket_no, bank_memo").in("ticket_no", r.unchanged);
      const dupes = (rows ?? []).filter((t: any) => t.bank_memo !== `stripe ${ref}`).map((t: any) => t.ticket_no as number);
      if (dupes.length > 0) {
        await sb.from("ticket_events").insert(
          dupes.map((n) => ({ ticket_no: n, action: "note", detail: `duplicate card payment ${ref}: ${formatTicket(n)} was already paid, consider a refund in Stripe` }))
        );
      }
    }
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("stripe webhook failed", e);
    return NextResponse.json({ error: "Could not record payment" }, { status: 500 }); // Stripe will retry
  }
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { markTickets } from "@/lib/markPaid";
import { formatTicket } from "@/lib/tickets";
import { verifyWebhook } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email";
import { buildReceipt } from "@/lib/receipt";

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

  // $1 test gift: real money, but not tied to any pledge. Email a receipt + alert and stop.
  if (s.metadata?.test === "1") {
    const cfg = await getSettings();
    const payer = s.customer_details?.email as string | undefined;
    const ref = typeof s.payment_intent === "string" ? s.payment_intent : s.id;
    const receipt = buildReceipt({
      name: s.customer_details?.name ?? "Friend",
      tickets: ["Test gift"],
      amount: Math.round((s.amount_total ?? 100) / 100),
      method: "card",
      received_on: new Date().toISOString().slice(0, 10),
      legal_name: cfg.legal_name,
      ein: cfg.ein,
      receipt_statement: cfg.receipt_statement,
      paidByName: s.customer_details?.name ?? null,
      reference: ref,
    });
    await Promise.all([
      payer ? sendEmail({ to: payer, ...receipt }) : Promise.resolve(),
      sendEmail({
        to: cfg.admin_notify_email,
        subject: "ICCR 313 test gift received ($1)",
        text: `Stripe checkout, webhook and email all work. Payment ${ref}${payer ? ` from ${payer}` : ""}. No pledge was changed.`,
        html: `<p>Stripe checkout, webhook and email all work.</p><p>Payment <b>${ref}</b>${payer ? ` from ${payer}` : ""}. No pledge was changed.</p>`,
      }),
    ]);
    return NextResponse.json({ ok: true, test: true });
  }

  const numbers = String(s.metadata?.tickets ?? "")
    .split(",")
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (numbers.length === 0) return NextResponse.json({ ok: true, ignored: "no tickets" });

  const ref = typeof s.payment_intent === "string" ? s.payment_intent : s.id;
  try {
    const r = await markTickets(numbers, true, {
      method: "card",
      memo: `stripe ${ref}`,
      eventDetail: `card: stripe ${ref}`,
      paidBy: { name: s.customer_details?.name ?? null, email: s.customer_details?.email ?? null },
      stripePaymentId: typeof s.payment_intent === "string" ? s.payment_intent : null,
    });
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

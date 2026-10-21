import { createHmac, timingSafeEqual } from "crypto";

// Card payments need both keys: the secret key to start a checkout and the
// webhook secret to learn that it was paid. Until both exist, card buttons stay hidden.
export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

const API = () => process.env.STRIPE_API_URL || "https://api.stripe.com";

export interface CheckoutInput {
  tickets: number[];
  pricePerTicketCents: number;
  feeCents: number; // 0 when the donor doesn't cover it
  pledgers?: string; // names of the people who pledged these tickets, shown in Stripe
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(i: CheckoutInput): Promise<{ id: string; url: string }> {
  const list = i.tickets.map((n) => `ICCR-${n}`).join(", ");
  const f = new URLSearchParams();
  f.set("mode", "payment");
  f.set("success_url", i.successUrl);
  f.set("cancel_url", i.cancelUrl);
  f.set("line_items[0][quantity]", String(i.tickets.length));
  f.set("line_items[0][price_data][currency]", "usd");
  f.set("line_items[0][price_data][unit_amount]", String(i.pricePerTicketCents));
  f.set("line_items[0][price_data][product_data][name]", `ICCR 313 ticket (${list})`);
  if (i.feeCents > 0) {
    f.set("line_items[1][quantity]", "1");
    f.set("line_items[1][price_data][currency]", "usd");
    f.set("line_items[1][price_data][unit_amount]", String(i.feeCents));
    f.set("line_items[1][price_data][product_data][name]", "Card processing fee (covered by you)");
  }
  const tickets = i.tickets.join(",");
  f.set("metadata[tickets]", tickets);
  f.set("payment_intent_data[metadata][tickets]", tickets);
  const who = i.pledgers ? ` (${i.pledgers})` : "";
  f.set("payment_intent_data[description]", `ICCR 313: ${list}${who}`);
  if (i.pledgers) {
    f.set("metadata[pledgers]", i.pledgers);
    f.set("payment_intent_data[metadata][pledgers]", i.pledgers);
  }

  const res = await fetch(`${API()}/v1/checkout/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: f,
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || !j.url) {
    console.error("Stripe checkout error", res.status, j?.error?.message);
    throw new Error("stripe_checkout_failed");
  }
  return { id: j.id, url: j.url };
}

// Verifies the `Stripe-Signature` header against the raw request body.
export function verifyWebhook(raw: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(expected);
  return sigs.some((s) => {
    const b = Buffer.from(s);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

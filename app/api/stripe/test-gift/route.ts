import { NextResponse } from "next/server";
import { isLimited } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/email";
import { createTestGiftSession, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Public but throttled: starts a fixed $1 checkout that is not tied to any ICCR number.
export async function POST(req: Request) {
  if (!stripeConfigured()) return NextResponse.json({ error: "Card payments aren't available yet." }, { status: 503 });
  if (await isLimited(req, "testgift", 5, 60)) {
    return NextResponse.json({ error: "Too many tries. Please wait a while." }, { status: 429 });
  }
  const base = siteUrl(req);
  try {
    const session = await createTestGiftSession(`${base}/thanks?test=1`, `${base}/`);
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Could not start the test checkout." }, { status: 502 });
  }
}

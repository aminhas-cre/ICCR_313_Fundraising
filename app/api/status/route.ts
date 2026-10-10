import { NextResponse } from "next/server";
import { loadByEmail } from "@/lib/pledgeView";
import { isLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public: look up your tickets by the email you pledged with. Throttled, and
// only ticket numbers + paid status come back (no phone, no other people's data).
export async function POST(req: Request) {
  if (await isLimited(req, "status", 30)) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes and try again." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter the email you pledged with." }, { status: 400 });
  }
  const view = await loadByEmail(email);
  if (!view || view.tickets.length === 0) {
    return NextResponse.json({ error: "We couldn't find any pledges for that email." }, { status: 404 });
  }
  return NextResponse.json({ view });
}

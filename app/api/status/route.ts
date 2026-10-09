import { NextResponse } from "next/server";
import { parseTicket } from "@/lib/tickets";
import { loadView } from "@/lib/pledgeView";
import { isLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const NOT_FOUND = { error: "We couldn't find a pledge with that ticket number and email." };

// Public: ticket number + the email used to pledge.
export async function POST(req: Request) {
  if (await isLimited(req, "status", 10)) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes and try again." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const no = parseTicket(body.ticket);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!no || !email) return NextResponse.json(NOT_FOUND, { status: 404 });

  const found = await loadView({ ticket_no: no });
  if (!found || (found.donor.email ?? "").toLowerCase() !== email) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }
  return NextResponse.json({ view: found.view });
}

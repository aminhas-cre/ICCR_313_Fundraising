import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { formatTicket, parseTicketList } from "@/lib/tickets";
import { PAYMENT_METHODS } from "@/lib/types";
import { markTickets } from "@/lib/markPaid";

export const dynamic = "force-dynamic";

// Admin: mark tickets paid (or unpaid) by number, e.g. "ICCR-2, 3, 5-9".
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  const parsed = parseTicketList(typeof b.tickets === "number" ? String(b.tickets) : b.tickets);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const paid = b.paid !== false;
  const method = PAYMENT_METHODS.find((m) => m === b.method) ?? "zelle";
  const received_on =
    typeof b.received_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.received_on)
      ? b.received_on
      : new Date().toISOString().slice(0, 10);
  const memo = typeof b.memo === "string" ? b.memo.trim().slice(0, 300) || null : null;

  try {
    const r = await markTickets(parsed.numbers, paid, { method, received_on, memo });
    if (r.missing.length === parsed.numbers.length) {
      return NextResponse.json({ error: `No pledged tickets match: ${r.missing.map(formatTicket).join(", ")}` }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Could not update tickets" }, { status: 500 });
  }
}

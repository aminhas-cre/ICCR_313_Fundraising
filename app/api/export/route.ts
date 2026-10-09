import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { formatTicket } from "@/lib/tickets";
import type { Donor } from "@/lib/types";

export const dynamic = "force-dynamic";

// Prefix formula-triggering chars so Excel/Sheets don't execute donor-entered text.
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseServerClient();
  const [{ data, error }, { data: pays }] = await Promise.all([
    sb.from("donors").select("*").order("ticket_no"),
    sb.from("payments").select("donor_id, amount").is("voided_at", null),
  ]);
  const got = new Map<string, number>();
  for (const p of pays ?? []) got.set(p.donor_id, (got.get(p.donor_id) ?? 0) + p.amount);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const donors = (data ?? []) as Donor[];
  const { ticket_price } = await getSettings();
  const names = new Map(donors.map((d) => [d.id, d.full_name]));
  const header = ["Ticket", "Name", "Phone", "Email", "Tickets", "Pledged $", "Received $", "Status", "Paid at", "Brought by", "Notes"];
  const lines = donors.map((d) =>
    [formatTicket(d.ticket_no), d.full_name, d.phone, d.email, d.ticket_count, d.ticket_count * ticket_price, got.get(d.id) ?? 0, d.status, d.paid_at,
      d.referred_by ? names.get(d.referred_by) : "", d.notes].map(cell).join(",")
  );
  return new NextResponse([header.map(cell).join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="313-donors.csv"' },
  });
}

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { formatTicket } from "@/lib/tickets";

export const dynamic = "force-dynamic";

// Prefix formula-triggering chars so Excel/Sheets don't execute donor-entered text.
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseServerClient()
    .from("tickets")
    .select("ticket_no, paid, received_on, pay_method, bank_memo, passed_on, passed_to, donors(full_name, email, phone)")
    .order("ticket_no");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const header = ["Ticket", "Name", "Email", "Phone", "Status", "Received on", "Method", "Bank memo", "Passed to"];
  const lines = (data ?? []).map((t: any) =>
    [formatTicket(t.ticket_no), t.donors?.full_name, t.donors?.email, t.donors?.phone, t.paid ? "Paid" : "Pledged",
      t.received_on, t.pay_method, t.bank_memo, t.passed_on ? t.passed_to ?? "yes" : ""].map(cell).join(",")
  );
  return new NextResponse([header.map(cell).join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="313-tickets.csv"' },
  });
}

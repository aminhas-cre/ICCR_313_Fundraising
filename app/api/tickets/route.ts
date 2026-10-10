import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Admin: every ticket with its owner.
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseServerClient()
    .from("tickets")
    .select("ticket_no, paid, paid_at, paid_amount, pay_method, received_on, bank_memo, passed_on, passed_to, donor_id, donors(full_name, email, phone)")
    .order("ticket_no");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { syncStatus } from "@/lib/payments";

// Void a payment (kept in the ledger for audit, excluded from totals).
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseServerClient();
  const { data, error } = await sb
    .from("payments")
    .update({ voided_at: new Date().toISOString() })
    .eq("id", params.id)
    .is("voided_at", null)
    .select("donor_id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) await syncStatus(data.donor_id);
  return NextResponse.json({ ok: true });
}

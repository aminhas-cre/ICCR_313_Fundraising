import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { parseDonor } from "@/lib/donorInput";
import { syncStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseServerClient();
  const [d, p] = await Promise.all([
    sb.from("donors").select("*").order("created_at", { ascending: false }),
    sb.from("payments").select("donor_id, amount").is("voided_at", null),
  ]);
  if (d.error) return NextResponse.json({ error: d.error.message }, { status: 500 });
  const paid = new Map<string, number>();
  for (const x of p.data ?? []) paid.set(x.donor_id, (paid.get(x.donor_id) ?? 0) + x.amount);
  const donors = (d.data ?? []).map((r) => ({ ...r, paid_amount: paid.get(r.id) ?? 0 }));
  return NextResponse.json({ donors });
}

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = parseDonor(body, false);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const sb = getSupabaseServerClient();
  const { data, error } = await sb.from("donors").insert({ ...parsed.data, source: "admin" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // "Already paid" shortcut: record the full amount as a payment so totals stay ledger-based.
  if (body.mark_paid) {
    const cfg = await getSettings();
    await sb.from("payments").insert({
      donor_id: data.id,
      amount: data.ticket_count * cfg.ticket_price,
      method: "other",
      memo: "Entered as already paid",
    });
    await syncStatus(data.id);
  }
  return NextResponse.json({ donor: data });
}

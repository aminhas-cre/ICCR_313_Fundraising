import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public (token-gated): a pledger marks a ticket as passed on to someone.
// This is a private note only. It never changes paid status.
export async function POST(req: Request) {
  if (await isLimited(req, "note", 60)) {
    return NextResponse.json({ error: "Too many changes. Please wait a few minutes." }, { status: 429 });
  }
  const b = await req.json().catch(() => ({}));
  const no = Number(b.ticket);
  const token = typeof b.token === "string" ? b.token : "";
  if (!Number.isInteger(no) || token.length < 20) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const passed_on = Boolean(b.passed_on);
  const passed_to = passed_on && typeof b.passed_to === "string" ? b.passed_to.trim().slice(0, 80) || null : null;

  const sb = getSupabaseServerClient();
  const { data: donor } = await sb.from("donors").select("id").eq("access_token", token).maybeSingle();
  if (!donor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await sb
    .from("tickets")
    .update({ passed_on, passed_to })
    .eq("ticket_no", no)
    .eq("donor_id", donor.id)
    .select("ticket_no")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await sb.from("ticket_events").insert({ ticket_no: no, action: "note", detail: passed_on ? `passed to ${passed_to ?? "someone"}` : "cleared" });
  return NextResponse.json({ ok: true });
}

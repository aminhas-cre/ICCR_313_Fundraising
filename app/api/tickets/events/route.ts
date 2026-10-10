import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseServerClient()
    .from("ticket_events")
    .select("id, ticket_no, action, detail, created_at")
    .order("id", { ascending: false })
    .limit(60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

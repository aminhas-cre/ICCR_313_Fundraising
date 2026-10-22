import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { sendEmail, emailConfigured } from "@/lib/email";
import { pledgeReminder } from "@/lib/emailTemplates";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const COOLDOWN_DAYS = 3;

interface Target { id: string; name: string; email: string; unpaid: number[] }

// Everyone with at least one unpaid ticket and an email, minus anyone reminded recently.
async function targets(): Promise<{ send: Target[]; recent: number }> {
  const sb = getSupabaseServerClient();
  const { data, error } = await sb
    .from("tickets")
    .select("ticket_no, donor_id, donors(full_name, email)")
    .eq("paid", false)
    .order("ticket_no");
  if (error) throw new Error(error.message);
  const byDonor = new Map<string, Target>();
  for (const t of (data ?? []) as any[]) {
    const email = t.donors?.email;
    if (!email) continue;
    const d: Target = byDonor.get(t.donor_id) ?? { id: t.donor_id, name: t.donors?.full_name ?? "Friend", email, unpaid: [] };
    d.unpaid.push(t.ticket_no);
    byDonor.set(t.donor_id, d);
  }
  const since = new Date(Date.now() - COOLDOWN_DAYS * 86400_000).toISOString();
  const { data: ev } = await sb
    .from("ticket_events")
    .select("ticket_no")
    .eq("action", "note")
    .eq("detail", "reminder")
    .gte("created_at", since);
  const reminded = new Set((ev ?? []).map((e: any) => e.ticket_no as number));
  const all = [...byDonor.values()];
  const send = all.filter((d) => !d.unpaid.some((n) => reminded.has(n)));
  return { send, recent: all.length - send.length };
}

// Preview: who would be emailed.
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { send, recent } = await targets();
    return NextResponse.json({
      people: send.length,
      pledges: send.reduce((a, d) => a + d.unpaid.length, 0),
      skippedRecent: recent,
      emailConfigured: emailConfigured(),
      cooldownDays: COOLDOWN_DAYS,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}

// Send the reminder to everyone in the preview.
export async function POST() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!emailConfigured()) return NextResponse.json({ error: "Email is not set up." }, { status: 400 });
  try {
    const cfg = await getSettings();
    const { send } = await targets();
    let sent = 0;
    const ok: number[] = [];
    for (let i = 0; i < send.length; i += 5) {
      const batch = send.slice(i, i + 5);
      const res = await Promise.all(
        batch.map((d) =>
          sendEmail({
            to: d.email,
            ...pledgeReminder({
              name: d.name,
              unpaid: d.unpaid,
              price: cfg.ticket_price,
              zelleEmail: cfg.zelle_email,
              venmoHandle: cfg.venmo_handle,
              launchgoodUrl: cfg.launchgood_url,
              cardEnabled: stripeConfigured(),
            }),
          })
        )
      );
      res.forEach((r, k) => {
        if (r.ok) {
          sent++;
          ok.push(...batch[k].unpaid);
        }
      });
    }
    if (ok.length) {
      await getSupabaseServerClient()
        .from("ticket_events")
        .insert(ok.map((n) => ({ ticket_no: n, action: "note", detail: "reminder" })));
    }
    return NextResponse.json({ sent, failed: send.length - sent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}

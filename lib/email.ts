// Sends mail through Resend's HTTP API. Safe no-op until RESEND_API_KEY and
// EMAIL_FROM are set in the environment, so pledging never breaks without email.
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(m: Mail): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!emailConfigured()) return { ok: false, skipped: true };
  try {
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [m.to],
        subject: m.subject,
        html: m.html,
        text: m.text,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend error", res.status, body.slice(0, 300));
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("Email send failed", e);
    return { ok: false, error: "network" };
  }
}

// Public base URL for links inside emails.
export function siteUrl(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

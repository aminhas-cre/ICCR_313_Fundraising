// Whitelist + validate donor fields from request bodies.
type Parsed = { error: string; data?: undefined } | { error?: undefined; data: Record<string, unknown> };

export function parseDonor(body: any, partial: boolean): Parsed {
  const out: Record<string, unknown> = {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 300) : null);

  if ("full_name" in body || !partial) {
    const n = str(body.full_name);
    if (!n) return { error: "Name is required" };
    out.full_name = n;
  }
  for (const k of ["phone", "email", "notes"] as const) if (k in body) out[k] = str(body[k]);
  if ("ticket_count" in body) {
    const t = Number(body.ticket_count);
    if (!Number.isInteger(t) || t < 1 || t > 100) return { error: "Tickets must be 1-100" };
    out.ticket_count = t;
  }
  if ("status" in body) {
    if (body.status !== "pledged" && body.status !== "paid") return { error: "Bad status" };
    out.status = body.status;
    out.paid_at = body.status === "paid" ? new Date().toISOString() : null;
  }
  if ("referred_by" in body) out.referred_by = str(body.referred_by);
  if ("show_public" in body) out.show_public = Boolean(body.show_public);
  return { data: out };
}

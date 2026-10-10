// Whitelist + validate pledger fields from admin request bodies.
type Parsed = { error: string; data?: undefined } | { error?: undefined; data: Record<string, unknown> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseDonor(body: any, partial: boolean): Parsed {
  const out: Record<string, unknown> = {};
  const str = (v: unknown, n = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

  if ("full_name" in body || !partial) {
    const n = str(body.full_name, 120);
    if (!n) return { error: "Name is required" };
    out.full_name = n;
  }
  if ("email" in body) {
    const e = str(body.email, 200)?.toLowerCase() ?? null;
    if (e && !EMAIL.test(e)) return { error: "That email doesn't look right" };
    out.email = e;
  }
  for (const k of ["phone", "notes"] as const) if (k in body) out[k] = str(body[k], 300);
  if ("show_public" in body) out.show_public = Boolean(body.show_public);
  return { data: out };
}

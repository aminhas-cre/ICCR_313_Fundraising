export const formatTicket = (n: number) => `ICCR-${String(n).padStart(4, "0")}`;

// Accepts "ICCR-0042", "iccr 42", "42". Returns null if it isn't a ticket number.
export function parseTicket(input: unknown): number | null {
  if (typeof input !== "string") return null;
  const m = input.trim().match(/^(?:iccr[\s-]*)?0*(\d{1,6})$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 ? n : null;
}

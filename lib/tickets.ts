// Ticket numbers are plain integers 1..N, displayed as ICCR-1, ICCR-2, ...
export const formatTicket = (n: number) => `ICCR-${n}`;

// Accepts "ICCR-2", "iccr 2", "2". Returns null if it isn't a ticket number.
export function parseTicket(input: unknown): number | null {
  if (typeof input !== "string") return null;
  const m = input.trim().match(/^(?:iccr[\s-]*)?0*(\d{1,5})$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 ? n : null;
}

// "ICCR-2, 3, 5-9" -> [2, 3, 5, 6, 7, 8, 9]. Used by the admin bulk mark-paid box.
export function parseTicketList(input: unknown, maxCount = 500): { numbers: number[] } | { error: string } {
  if (typeof input !== "string" || !input.trim()) return { error: "Enter at least one ticket number." };
  const cleaned = input.replace(/iccr[\s-]*/gi, "");
  const set = new Set<number>();
  for (const tok of cleaned.split(/[\s,;]+/).filter(Boolean)) {
    const single = tok.match(/^0*(\d{1,5})$/);
    const range = tok.match(/^0*(\d{1,5})-0*(\d{1,5})$/);
    if (single) {
      const n = Number(single[1]);
      if (n < 1) return { error: `"${tok}" is not a valid ticket number.` };
      set.add(n);
    } else if (range) {
      const a = Number(range[1]), b = Number(range[2]);
      if (a < 1 || b < a) return { error: `"${tok}" is not a valid range.` };
      if (b - a + 1 > maxCount) return { error: "That range is too large." };
      for (let n = a; n <= b; n++) set.add(n);
    } else {
      return { error: `Couldn't read "${tok}". Use numbers like 2, 3, 5-9.` };
    }
    if (set.size > maxCount) return { error: `Too many tickets at once (max ${maxCount}).` };
  }
  return { numbers: [...set].sort((a, b) => a - b) };
}

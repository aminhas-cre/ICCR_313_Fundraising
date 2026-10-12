// Stripe card fee (2.9% + 30c). Pure so the browser and server agree on the number.
// Returns the extra cents a donor adds so ICCR nets the full ticket amount.
export function feeCents(baseCents: number): number {
  const total = Math.ceil((baseCents + 30) / (1 - 0.029));
  return total - baseCents;
}
export const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

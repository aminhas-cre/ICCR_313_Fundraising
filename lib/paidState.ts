// "Paid" as donors and the public see it. `tickets.paid` stays the verified flag
// (Stripe completed, or the committee confirmed it in the bank). A pledge also shows
// as Paid when the donor chose Zelle, Venmo or LaunchGood; card-only waits for Stripe.
export const SELF_REPORTED = ["zelle", "venmo", "launchgood"] as const;

export function countsAsPaid(t: { paid: boolean; chosen_methods?: string[] | null }): boolean {
  return t.paid || (t.chosen_methods ?? []).some((m) => (SELF_REPORTED as readonly string[]).includes(m));
}

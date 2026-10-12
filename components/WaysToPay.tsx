import PayOptions from "./PayOptions";
import LaunchGoodLink from "./LaunchGoodLink";

// "Ways to pay" panel for Step 1: Zelle/Venmo suggested (free), card / Apple Pay / Google Pay as the alternative.
export default function WaysToPay({
  zelle,
  venmo,
  launchgood,
  cardEnabled,
  price,
}: {
  zelle: string;
  venmo: string;
  launchgood: string;
  cardEnabled: boolean;
  price: number;
}) {
  return (
    <section className="mt-5 space-y-3" aria-label="Ways to pay">
      <h2 className="font-serif text-xl font-semibold text-emerald">Ways to pay your ${price.toLocaleString("en-US")}</h2>

      <div className="rounded-2xl border-2 border-emerald bg-white p-5 shadow-sm">
        <p className="inline-block rounded-full bg-emerald px-3 py-1 text-xs font-bold uppercase tracking-wider text-sand">We suggest this</p>
        <h3 className="mt-2 font-serif text-lg font-semibold text-emerald">Zelle or Venmo</h3>
        <p className="mt-1 text-sm text-ink/80">No fees, so 100% of your gift reaches ICCR.</p>
        <div className="mt-2">
          <PayOptions zelle={zelle} venmo={venmo} example="ICCR-2" />
        </div>
      </div>

      {launchgood && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-emerald">Or give through LaunchGood</h3>
          <p className="mt-1 text-sm text-ink/80">Pledge below first so you get your ticket number, then give on our LaunchGood page. It still counts as your ${price.toLocaleString("en-US")} ticket.</p>
          <div className="mt-3"><LaunchGoodLink url={launchgood} price={price} /></div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-emerald">Or pay by card</h3>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs font-semibold" aria-label="Accepted payment types">
          {["Apple Pay", "Google Pay", "Visa", "Mastercard", "Amex"].map((b) => (
            <li key={b} className="rounded-full bg-sand-dark px-3 py-1">{b}</li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-ink/80">
          {cardEnabled
            ? "Secure checkout by Stripe. There's a small card processing fee, and you can choose to cover it so ICCR gets the full amount. You'll see the card option right after you pledge."
            : "Coming soon. For now, please use Zelle or Venmo above."}
        </p>
      </div>
    </section>
  );
}

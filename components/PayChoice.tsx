"use client";
import PayOptions from "./PayOptions";
import LaunchGoodLink from "./LaunchGoodLink";
import { CHOICE_LABELS, type ChoiceMethod } from "@/lib/types";

function Card({ on, onToggle, title, badge, disabled, children }: { m: ChoiceMethod; on: boolean; onToggle: () => void; title: string; badge?: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${on ? "border-emerald bg-emerald/5" : "border-sand-dark bg-white"} ${disabled ? "opacity-80" : ""}`}>
      <label className={`flex min-h-[44px] items-center gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <input type="checkbox" className="h-6 w-6 flex-none accent-emerald" checked={on} disabled={disabled} onChange={onToggle} />
        <span className="flex-1">
          <span className="block font-serif text-lg font-semibold text-emerald">I plan to pay by {title}</span>
          {badge && <span className="mt-0.5 inline-block rounded-full bg-emerald px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-sand">{badge}</span>}
        </span>
      </label>
      <div className="mt-2 sm:pl-9">{children}</div>
    </div>
  );
}

// "How do you plan to pay?" One checkbox per payment method; the choice is saved with the pledge.
export default function PayChoice({
  zelle,
  venmo,
  launchgood,
  cardEnabled,
  price,
  value,
  onChange,
  error,
}: {
  zelle: string;
  venmo: string;
  launchgood: string;
  cardEnabled: boolean;
  price: number;
  value: ChoiceMethod[];
  onChange: (v: ChoiceMethod[]) => void;
  error?: string;
}) {
  const toggle = (m: ChoiceMethod) => onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m]);

  const card = (m: ChoiceMethod) => ({ m, on: value.includes(m), onToggle: () => toggle(m) });

  return (
    <fieldset aria-describedby={error ? "pay-choice-err" : undefined}>
      <legend className="font-serif text-xl font-semibold text-emerald">How do you plan to pay your ${price.toLocaleString("en-US")}?</legend>
      <p className="mt-1 text-sm text-ink/80">Tick the way you plan to pay so we can keep track. You pay after you pledge.</p>
      <div className="mt-3 space-y-3">
        <Card {...card("zelle")} title="Zelle" badge="We suggest this">
          <p className="mb-1 text-sm text-ink/80">No fees, so 100% of your gift reaches ICCR.</p>
          <PayOptions zelle={zelle} venmo={venmo} show="zelle" example="ICCR-2" noun="pledge" />
        </Card>
        {venmo && (
          <Card {...card("venmo")} title="Venmo" badge="We suggest this">
            <p className="mb-1 text-sm text-ink/80">No fees, so 100% of your gift reaches ICCR.</p>
            <PayOptions zelle={zelle} venmo={venmo} show="venmo" example="ICCR-2" noun="pledge" />
          </Card>
        )}
        {launchgood && (
          <Card {...card("launchgood")} title="LaunchGood">
            <p className="mb-2 text-sm text-ink/80">Give on our LaunchGood page. It still counts as your ${price.toLocaleString("en-US")} pledge.</p>
            <LaunchGoodLink url={launchgood} price={price} noun="pledge" />
          </Card>
        )}
        <Card {...card("card")} title="card, Apple Pay or debit" disabled={!cardEnabled}>
          <ul className="flex flex-wrap gap-2 text-xs font-semibold" aria-label="Accepted payment types">
            {["Apple Pay", "Debit", "Visa", "Mastercard", "Amex"].map((b) => (
              <li key={b} className="rounded-full bg-sand-dark px-3 py-1">{b}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink/80">
            {cardEnabled
              ? "Secure checkout by Stripe, with a small card fee you can choose to cover. You'll get a big pay button right after you pledge."
              : "Coming soon. For now, please use Zelle, Venmo or LaunchGood above."}
          </p>
        </Card>
      </div>
      {error && <p id="pay-choice-err" role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
    </fieldset>
  );
}

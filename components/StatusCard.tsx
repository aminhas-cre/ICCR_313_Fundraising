import type { PledgeView } from "@/lib/types";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const BADGE = {
  paid: { label: "Paid in full", cls: "bg-emerald text-sand" },
  partial: { label: "Partially paid", cls: "bg-gold-light text-ink" },
  pledged: { label: "Pledged: awaiting payment", cls: "bg-sand-dark text-ink" },
} as const;

export default function StatusCard({ v }: { v: PledgeView }) {
  const b = BADGE[v.status];
  const pct = Math.min(100, (v.paid / v.due) * 100);
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8" aria-label="Pledge status">
      <p className="text-sm text-ink/70">Your ICCR ticket</p>
      <p className="font-serif text-4xl font-bold text-emerald">{v.ticket}</p>
      <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${b.cls}`}>
        {v.status === "paid" && (
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M8 13.2 4.8 10l-1.3 1.3L8 15.8l8.5-8.5-1.3-1.3z" />
          </svg>
        )}
        {b.label}
      </p>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-sand-dark" role="progressbar" aria-valuemin={0} aria-valuemax={v.due} aria-valuenow={Math.min(v.paid, v.due)} aria-label="Amount received">
        <div className="h-full bg-emerald" style={{ width: `${pct}%` }} />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div><dt className="text-xs text-ink/70">Pledged</dt><dd className="font-semibold">{money(v.due)}</dd></div>
        <div><dt className="text-xs text-ink/70">Received</dt><dd className="font-semibold text-emerald">{money(v.paid)}</dd></div>
        <div><dt className="text-xs text-ink/70">Balance</dt><dd className="font-semibold">{money(v.balance)}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-ink/80">
        {v.name} · {v.tickets} ticket{v.tickets > 1 ? "s" : ""}
      </p>

      {v.balance > 0 && (
        <div className="mt-5 rounded-xl bg-sand p-4 text-sm">
          <p className="font-semibold text-emerald">To complete your pledge</p>
          <p className="mt-1">
            Send <b>{money(v.balance)}</b> by Zelle to <b className="break-all">{v.zelle_email}</b> and put{" "}
            <b>{v.ticket}</b> in the memo. Payments are matched by hand, so it can take a day or two to show here.
          </p>
        </div>
      )}

      {v.payments.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Payments received</h3>
          <ul className="mt-1 divide-y divide-sand-dark text-sm">
            {v.payments.map((p, i) => (
              <li key={i} className="flex justify-between py-2">
                <span>{p.received_on} · <span className="capitalize">{p.method}</span></span>
                <span className="font-semibold">{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function Thermometer({
  label, tickets, goalTickets, amount, goalAmount, tone,
}: {
  label: string;
  tickets: number;
  goalTickets: number;
  amount: number;
  goalAmount: number;
  tone: "gold" | "emerald";
}) {
  const pct = Math.min(100, goalAmount > 0 ? (amount / goalAmount) * 100 : 0);
  const fill = tone === "emerald" ? "bg-emerald" : "bg-gold";
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink/80">{label}</p>
          <p className="font-serif text-3xl font-bold text-emerald">
            {tickets}
            <span className="text-xl text-ink/60"> / {goalTickets}</span>
          </p>
        </div>
        <p className="text-right text-sm text-ink/70">
          <span className="font-serif text-xl font-bold text-emerald">{fmt(amount)}</span>
          <br />of {fmt(goalAmount)}
        </p>
      </div>
      <div
        className="mt-2 h-5 overflow-hidden rounded-full bg-sand-dark"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={goalTickets}
        aria-valuenow={Math.min(tickets, goalTickets)}
      >
        <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

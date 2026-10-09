import { getStats } from "@/lib/stats";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export default async function Home() {
  const cfg = await getSettings();
  const s = await getStats(cfg);
  const GOAL_DONORS = cfg.goal_donors;
  const pct = Math.min(100, (s.paidAmount / s.goalAmount) * 100);
  const pledgedPct = Math.min(100 - pct, (s.pledgedAmount / s.goalAmount) * 100);
  const remaining = Math.max(0, GOAL_DONORS - s.paidTickets);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-gold-ink">
        Islamic Center of Castle Rock
      </p>
      <h1 className="mt-2 text-center font-serif text-5xl font-bold text-emerald sm:text-6xl">313</h1>
      <p className="mt-1 text-center font-serif text-xl text-emerald">
        Building Our Masjid, Building Our Future
      </p>

      <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm sm:p-8" aria-label="Progress">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-serif text-4xl font-bold text-emerald">{s.paidTickets}<span className="text-2xl text-ink/60"> / {GOAL_DONORS}</span></p>
            <p className="text-sm text-ink/70">founding tickets paid</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl font-bold text-emerald">{fmt(s.paidAmount)}</p>
            <p className="text-sm text-ink/70">of {fmt(s.goalAmount)}</p>
          </div>
        </div>
        <div
          className="mt-4 flex h-5 overflow-hidden rounded-full bg-sand-dark"
          role="progressbar" aria-valuemin={0} aria-valuemax={GOAL_DONORS} aria-valuenow={s.paidTickets}
          aria-label="Founding tickets paid"
        >
          <div className="bg-emerald" style={{ width: `${pct}%` }} />
          <div className="bg-gold-light" style={{ width: `${pledgedPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-ink/70">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald" /> Paid{" "}
          <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-full bg-gold-light" /> Pledged ({fmt(s.pledgedAmount)})
        </p>
        <p className="mt-4 text-sm font-semibold text-emerald">
          {remaining > 0 ? `${remaining} spots left. Be one of the first.` : "We hit 313, Alhamdulillah. The 313 are the spark, not the ceiling."}
        </p>
      </section>

      <section className="mt-8 rounded-2xl bg-emerald p-6 text-sand sm:p-8">
        <h2 className="font-serif text-2xl font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Donate {fmt(cfg.ticket_price)}</li>
          <li>Take a {fmt(cfg.ticket_price)} ticket</li>
          <li>Reach out to others</li>
          <li>Take 5 tickets and bring 5 people</li>
        </ol>
        <p className="mt-5 text-sm text-sand/80">Zelle</p>
        <p className="break-all font-semibold">{cfg.zelle_email}</p>
        {cfg.zelle_note && <p className="mt-1 text-xs text-sand/70">{cfg.zelle_note}</p>}
      </section>

      {s.leaders.length > 0 && (
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-emerald">Top connectors</h2>
          <p className="text-sm text-ink/70">Brothers and sisters who brought others in.</p>
          <ul className="mt-3 divide-y divide-sand-dark">
            {s.leaders.map((l) => (
              <li key={l.name} className="flex justify-between py-2">
                <span>{l.name}</span>
                <span className="font-semibold text-emerald">{l.brought} brought</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 text-sm text-ink/80">
        <p>
          At Badr, 313 Companions stood up for the truth. They were few, outnumbered about three to one, and
          they had very little, yet they stepped forward first and Allah honored them. A small group that steps
          up first lays the foundation for everyone who follows.
        </p>
        <p className="mt-3">
          Your gift builds a permanent prayer space, youth and community programs, Islamic education, and
          sadaqah jariyah that keeps giving long after us.
        </p>
      </section>
    </main>
  );
}

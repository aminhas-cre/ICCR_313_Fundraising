import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import ShareButtons from "@/components/ShareButtons";
import { getStats } from "@/lib/stats";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

const FAQ = [
  ["Why 313?", "At Badr, 313 Companions stood up for the truth. They were few and had very little, yet they stepped forward first and Allah honored them. A small group that steps up first lays the foundation for everyone who follows."],
  ["How do I pay?", "Pledge online to get your ICCR ticket number, then send your gift by Zelle and put that ticket number in the memo. We match payments by hand, so it can take a day or two to show on your pledge page."],
  ["How do I know my pledge was received?", "Open your private pledge page (or use Check my pledge with your ticket number and email). It shows Pledged, Partially paid, or Paid in full."],
  ["What does \"bring 5 people\" mean?", "Take 5 tickets and invite 5 people. Share your personal link after you pledge, and everyone who pledges through it is credited to you."],
  ["Where does the money go?", "A permanent prayer space, youth and community programs, Islamic education, and sadaqah jariyah that keeps giving long after us."],
];

export default async function Home() {
  const cfg = await getSettings();
  const s = await getStats(cfg);
  const GOAL = cfg.goal_donors;
  const pct = Math.min(100, (s.paidAmount / s.goalAmount) * 100);
  const pledgedPct = Math.min(100 - pct, (s.pledgedAmount / s.goalAmount) * 100);
  const remaining = Math.max(0, GOAL - s.paidTickets);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="py-10 text-center sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-ink">Islamic Center of Castle Rock</p>
          <h1 className="mt-2 font-serif text-6xl font-bold text-emerald sm:text-7xl">313</h1>
          <p className="mt-1 font-serif text-xl text-emerald sm:text-2xl">Building Our Masjid, Building Our Future</p>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink/80">
            We&apos;re asking {GOAL} people to be among the first to give {fmt(cfg.ticket_price)} each. A founding base of{" "}
            <b>{fmt(s.goalAmount)}</b> to keep our masjid strong for generations.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/pledge" className="btn-primary !px-8 !py-3 text-base">Pledge {fmt(cfg.ticket_price)}</Link>
            <Link href="/status" className="btn-secondary !px-6 !py-3">Check my pledge</Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8" aria-label="Progress">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-serif text-4xl font-bold text-emerald">{s.paidTickets}<span className="text-2xl text-ink/60"> / {GOAL}</span></p>
              <p className="text-sm text-ink/70">founding tickets paid</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl font-bold text-emerald">{fmt(s.paidAmount)}</p>
              <p className="text-sm text-ink/70">of {fmt(s.goalAmount)}</p>
            </div>
          </div>
          <div className="mt-4 flex h-5 overflow-hidden rounded-full bg-sand-dark" role="progressbar" aria-valuemin={0} aria-valuemax={GOAL} aria-valuenow={s.paidTickets} aria-label="Founding tickets paid">
            <div className="bg-emerald" style={{ width: `${pct}%` }} />
            <div className="bg-gold-light" style={{ width: `${pledgedPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink/70">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald" /> Paid{" "}
            <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-full bg-gold-light" /> Pledged, awaiting payment ({fmt(s.pledgedAmount)})
          </p>
          <p className="mt-4 text-sm font-semibold text-emerald">
            {remaining > 0 ? `${remaining} spots left. Be one of the first.` : "We hit 313, Alhamdulillah. The 313 are the spark, not the ceiling."}
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-emerald p-6 text-sand sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 space-y-3">
            {[
              ["Pledge", `Choose your tickets (${fmt(cfg.ticket_price)} each) and get your ICCR ticket number.`],
              ["Pay by Zelle", `Send to ${cfg.zelle_email} with your ticket number in the memo.`],
              ["Track it", "Your private page shows when your payment is received."],
              ["Bring 5", "Take 5 tickets, bring 5 people. Share your personal link."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sand font-bold text-emerald" aria-hidden="true">{i + 1}</span>
                <span><b>{t}.</b> <span className="text-sand/90">{d}</span></span>
              </li>
            ))}
          </ol>
          {cfg.zelle_note && <p className="mt-4 text-xs text-sand/70">{cfg.zelle_note}</p>}
        </section>

        {s.supporters.length > 0 && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-serif text-2xl font-semibold text-emerald">Recent supporters</h2>
            <ul className="mt-3 divide-y divide-sand-dark">
              {s.supporters.map((x, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold">{x.name}</span>
                  <span className="text-ink/70">{x.tickets} ticket{x.tickets > 1 ? "s" : ""} · {x.paid ? "paid" : "pledged"}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {s.leaders.length > 0 && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-serif text-2xl font-semibold text-emerald">Top connectors</h2>
            <p className="text-sm text-ink/70">Brothers and sisters who brought others in.</p>
            <ul className="mt-3 divide-y divide-sand-dark">
              {s.leaders.map((l) => (
                <li key={l.name} className="flex justify-between py-2 text-sm">
                  <span>{l.name}</span>
                  <span className="font-semibold text-emerald">{l.brought} brought</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-emerald">Spread the word</h2>
          <p className="mt-1 text-sm text-ink/80">Every person you bring in multiplies your reward, in sha Allah.</p>
          <div className="mt-3"><ShareButtons /></div>
        </section>

        <section className="mt-8" aria-label="Frequently asked questions">
          <h2 className="font-serif text-2xl font-semibold text-emerald">Questions</h2>
          <div className="mt-3 divide-y divide-sand-dark rounded-2xl bg-white shadow-sm">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-emerald focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald">{q}</summary>
                <p className="mt-2 text-sm text-ink/80">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-ink/60">
          Islamic Center of Castle Rock · <Link className="underline" href="/admin">Committee</Link>
        </footer>
      </main>
    </>
  );
}

import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import ShareButtons from "@/components/ShareButtons";
import Thermometer from "@/components/Thermometer";
import { getStats } from "@/lib/stats";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
const SHOW = 100; // supporters shown before "and N more"

export default async function Home() {
  const cfg = await getSettings();
  const s = await getStats(cfg);
  const full = s.numbersLeft === 0;
  const shown = s.supporters.slice(0, SHOW);
  const more = s.supporters.length - shown.length;

  const FAQ: [string, string][] = [
    ["Why 313?", "At Badr, 313 Companions stood up for the truth. They were few and had very little, yet they stepped forward first and Allah honored them. A small group that steps up first lays the foundation for everyone who follows."],
    ["How do I pay?", `Pledge online and you'll get your ICCR ticket numbers. Then send ${fmt(cfg.ticket_price)} per ticket by Zelle to ${cfg.zelle_email} and put the ticket number in the memo. We match payments by hand, so it can take a day or two to show.`],
    ["Does every ticket have its own number?", "Yes. If you pledge 5 tickets you get 5 numbers. You can pay for them yourself or give a ticket to someone else, like an uncle, who sends the Zelle with that ticket's number in the memo."],
    ["How do I know my pledge was paid?", "Use Check my pledge with your email. It lists each of your tickets and whether it's been paid."],
    ["Where does the money go?", "A permanent prayer space, youth and community programs, Islamic education, and sadaqah jariyah that keeps giving long after us."],
  ];

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="py-10 text-center sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-ink">Islamic Center of Castle Rock</p>
          <h1 className="mt-2 font-serif text-6xl font-bold text-emerald sm:text-7xl">313</h1>
          <p className="mt-1 font-serif text-xl text-emerald sm:text-2xl">Building Our Masjid, Building Our Future</p>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink/80">
            We&apos;re asking {cfg.goal_donors} people to be among the first to give {fmt(cfg.ticket_price)} each. A founding
            base of <b>{fmt(s.goalAmount)}</b> to keep our masjid strong for generations.
          </p>
          {full ? (
            <p className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-4 text-sm font-semibold text-emerald shadow-sm">
              We hit {cfg.goal_donors}, alhamdulillah. The {cfg.goal_donors} are the spark, not the ceiling.
            </p>
          ) : (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/pledge" className="btn-secondary !px-8 !py-3 text-base">Pledge</Link>
              <Link href="/pledge?pay=1" className="btn-primary !px-8 !py-3 text-base">Pledge and pay</Link>
            </div>
          )}
        </section>

        <section className="space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8" aria-label="Progress">
          <Thermometer label="Pledged" tickets={s.pledgedTickets} goalTickets={s.goalTickets} amount={s.pledgedAmount} goalAmount={s.goalAmount} tone="gold" />
          <Thermometer label="Paid" tickets={s.paidTickets} goalTickets={s.goalTickets} amount={s.paidAmount} goalAmount={s.goalAmount} tone="emerald" />
          {!full && <p className="text-sm font-semibold text-emerald">{s.numbersLeft} ticket{s.numbersLeft === 1 ? "" : "s"} left. Be one of the first.</p>}
        </section>

        <section className="mt-8 rounded-2xl bg-emerald p-6 text-sand sm:p-8">
          <h2 className="font-serif text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 space-y-4">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sand font-bold text-emerald" aria-hidden="true">1</span>
              <span><b>Pledge.</b> Choose your tickets, {fmt(cfg.ticket_price)} each, and get your ICCR ticket numbers for the tickets you pledged.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sand font-bold text-emerald" aria-hidden="true">2</span>
              <span>
                <b>Put the ticket number in the memo.</b> That&apos;s how we match your payment.
                <span className="mt-2 block rounded-xl bg-sand p-3 text-sm font-semibold text-emerald">
                  Zelle to <span className="break-all">{cfg.zelle_email}</span> with the ticket number in the memo, like ICCR-2.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sand font-bold text-emerald" aria-hidden="true">3</span>
              <span><b>Track it.</b> Use <Link href="/status" className="underline">Check my pledge</Link> to see which tickets have been paid. Tick the box next to each ticket you&apos;ve passed on to someone so you can keep track.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sand font-bold text-emerald" aria-hidden="true">4</span>
              <span><b>Share.</b> Send the link to this page to others and commit to additional pledges.</span>
            </li>
          </ol>
          {cfg.zelle_note && <p className="mt-4 text-xs text-sand/70">{cfg.zelle_note}</p>}
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8" aria-label="Supporters">
          <h2 className="font-serif text-2xl font-semibold text-emerald">Pledges so far</h2>
          {shown.length === 0 ? (
            <p className="mt-2 text-sm text-ink/70">Be the first to pledge, in sha Allah.</p>
          ) : (
            <>
              <ul className="mt-3 max-h-96 divide-y divide-sand-dark overflow-y-auto pr-1">
                {shown.map((x, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-semibold">{x.name}</span>
                    <span className="text-ink/70">{x.count} pledge{x.count === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ul>
              {more > 0 && <p className="mt-2 text-xs text-ink/70">and {more} more</p>}
            </>
          )}
        </section>

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

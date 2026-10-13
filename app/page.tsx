import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import ShareButtons from "@/components/ShareButtons";
import Thermometer from "@/components/Thermometer";
import CampaignStory from "@/components/CampaignStory";
import CtaButtons from "@/components/CtaButtons";
import PayOptions from "@/components/PayOptions";
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
    ["Who should I pledge for?", `Start with yourself: make your own donation. Then pledge tickets for your family and friends. Each ticket has its own ICCR number, so you can send a person their number and they pay that exact ticket. Bringing your close ones in is what makes this work.`],
    ["How do I pay?", `Pledge online and you'll get your ICCR ticket numbers. Then send ${fmt(cfg.ticket_price)} per ticket by Zelle to ${cfg.zelle_email}${cfg.venmo_handle ? ` or Venmo @${cfg.venmo_handle}` : ""} and put the ticket number in the memo (or Venmo note). Both are free for ICCR.${cfg.launchgood_url ? ` You can also give ${fmt(cfg.ticket_price)} per ticket on our LaunchGood page (use the same email you pledged with).` : ""} We match payments by hand, so it can take a day or two to show.`],
    ["Does every ticket have its own number?", "Yes. If you pledge 5 tickets you get 5 numbers. You can pay for them yourself or give a ticket to someone else, like an uncle, who sends the Zelle or Venmo with that ticket's number in the memo."],
    ["How do I know my pledge was paid?", "Use Check my pledge with your email. It lists each of your tickets and whether it's been paid."],
    ["Where does the money go?", "A permanent prayer space, youth and community programs, Islamic education, and sadaqah jariyah that keeps giving long after us."],
  ];

  const title = (
    <section className="pb-6 pt-10 text-center sm:pb-8 sm:pt-14">
      <p className="text-sm font-semibold uppercase tracking-widest text-gold-ink">Islamic Center of Castle Rock</p>
      <h1 className="mt-2 font-serif text-6xl font-bold text-emerald sm:text-7xl">313</h1>
      <p className="mx-auto mt-2 max-w-xl font-serif text-2xl leading-snug text-emerald sm:text-3xl">
        Support Your Castle Rock Muslim Community Center
      </p>
    </section>
  );

  const ask = full ? (
    <p className="mx-auto mt-6 max-w-md rounded-2xl bg-white p-4 text-center text-sm font-semibold text-emerald shadow-sm">
      We hit {cfg.goal_donors}, alhamdulillah. The {cfg.goal_donors} are the spark, not the ceiling.
    </p>
  ) : (
    <div className="mx-auto mt-6 max-w-xl text-left">
      <CtaButtons price={cfg.ticket_price} />
      <p className="mt-4 rounded-2xl bg-sand-dark p-4 text-sm text-ink/90">
        <b className="text-emerald">Start with yourself, then bring your people.</b> Make your own donation first. Then
        pledge tickets for your family and friends and send each person their ICCR number so they can pay it. Every one
        of us has close ones who would want to be part of this, so please bring them with you.
      </p>
    </div>
  );

  const rest = (
    <>
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
              <span className="mt-2 block rounded-xl bg-sand p-3 text-emerald">
                <PayOptions zelle={cfg.zelle_email} venmo={cfg.venmo_handle} example="ICCR-2" />
                {cfg.launchgood_url && (
                  <span className="mt-2 block text-sm">
                    Or <a href={cfg.launchgood_url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">give through LaunchGood</a>. Use the same email you pledged with.
                  </span>
                )}
              </span>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sand font-bold text-emerald" aria-hidden="true">3</span>
            <span><b>Track it.</b> Use <Link href="/status" className="underline">Check my pledge</Link> to see which tickets have been paid. Tick the box next to each ticket you&apos;ve passed on to someone so you can keep track.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sand font-bold text-emerald" aria-hidden="true">4</span>
            <span><b>Bring your people.</b> Make your own donation first, then pledge tickets for your family and friends. Send each person their ICCR number and share the link to this page so they can join too.</span>
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
    </>
  );

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16">
        {title}
        {/* Order: slogan -> why (story) -> ask -> progress -> how -> who else gave -> share -> FAQ */}
        <CampaignStory goal={cfg.goal_donors} price={cfg.ticket_price} goalAmount={s.goalAmount} />
        {ask}
        <section className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8" aria-label="Progress">
          <Thermometer label="Pledged" tickets={s.pledgedTickets} goalTickets={s.goalTickets} amount={s.pledgedAmount} goalAmount={s.goalAmount} tone="gold" />
          <Thermometer label="Paid" tickets={s.paidTickets} goalTickets={s.goalTickets} amount={s.paidAmount} goalAmount={s.goalAmount} tone="emerald" />
          {!full && <p className="text-sm font-semibold text-emerald">{s.numbersLeft} ticket{s.numbersLeft === 1 ? "" : "s"} left. Be one of the first.</p>}
        </section>
        {rest}
      </main>
    </>
  );
}

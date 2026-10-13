// The "why we're raising this" message. Server component, no client JS.
export default function CampaignStory({ goal, price, goalAmount }: { goal: number; price: number; goalAmount: number }) {
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  return (
    <section
      aria-label="Why we are fundraising"
      className="rounded-2xl border-l-4 border-gold bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="font-serif text-3xl font-bold text-emerald">Be One of the {goal}</h2>
      <p className="mt-3 rounded-xl border-l-4 border-emerald bg-sand p-4 text-base font-semibold text-emerald sm:text-lg">
        We’re asking {goal} people to step up first with {fmt(price)} each. Together, that’s {fmt(goalAmount)} to keep our
        masjid open and strong.
      </p>

      <h3 className="mt-6 font-serif text-xl font-semibold text-emerald">Why we need your help:</h3>
      <p className="mt-2 font-serif text-xl leading-snug text-emerald sm:text-2xl">
        Alhamdulillah, the Islamic Center of Castle Rock has been a home for prayer, learning, and community.
      </p>
      <p className="mt-3 text-base text-ink/90">
        But our rent fund is running low. Without the community stepping in, keeping our doors open and our services
        running is at real risk.
      </p>

      <h3 className="mt-6 font-serif text-xl font-semibold text-emerald">Why {goal}?</h3>
      <p className="mt-2 text-base text-ink/90">
        At the Battle of Badr, {goal} Companions stood up for the truth. They were few and outnumbered about three to one,
        yet they committed fully, and Allah gave them victory.
      </p>
      <blockquote className="mt-3 border-l-4 border-gold pl-4">
        <p className="font-serif text-lg italic leading-snug text-emerald sm:text-xl">
          “And Allah had already given you victory at Badr while you were few.”
        </p>
        <footer className="mt-1 text-sm text-ink/70">(Quran 3:123)</footer>
      </blockquote>
      <p className="mt-4 rounded-xl bg-sand p-4 text-base font-semibold text-emerald">
        The lesson: a small group that steps up first lays the foundation for everyone who follows.
      </p>
    </section>
  );
}

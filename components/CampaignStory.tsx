// The "why we're raising this" message. Server component, no client JS.
export default function CampaignStory({ goal, price, goalAmount }: { goal: number; price: number; goalAmount: number }) {
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  return (
    <section
      aria-label="Why we are fundraising"
      className="rounded-2xl border-l-4 border-gold bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="font-serif text-2xl font-semibold text-emerald">Introducing our ICCR {goal} fundraiser:</h2>

      <p className="mt-3 font-serif text-xl leading-snug text-emerald sm:text-2xl">
        Alhamdulillah, ICCR has been a home for prayer, learning, and community here in Castle Rock.
      </p>
      <p className="mt-3 text-base text-ink/90">
        Unfortunately, our funds for rent are running low. Without the community stepping in, keeping our doors open and
        our services running is at real risk.
      </p>

      <h3 className="mt-6 font-serif text-xl font-semibold text-emerald">ICCR {goal} Campaign:</h3>
      <p className="mt-2 text-base text-ink/90">
        <b>Why {goal}?</b> At Badr, {goal} Companions stood up for the truth. They were few, outnumbered about three to
        one. Yet they committed and risked everything, and Allah honored them. The Quran reminds us that He gave them
        victory at Badr while they were few.
      </p>
      <p className="mt-3 rounded-xl bg-sand p-4 text-base font-semibold text-emerald">
        The lesson: a small group that steps up first lays the foundation for everyone who follows.
      </p>

      <p className="mt-4 text-base text-ink/90">
        We are asking for {goal} people to be among the first to give {fmt(price)} each. That&apos;s a founding base of{" "}
        <b>{fmt(goalAmount)}</b> to keep our masjid strong and supported. The {goal} are the spark, not the ceiling.
      </p>
    </section>
  );
}

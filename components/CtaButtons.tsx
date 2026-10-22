import Link from "next/link";

// The two-step ask: donate yourself, then pledge for family & friends. Used in the hero and again after the story.
export default function CtaButtons({ price }: { price: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/pledge?pay=1"
        className="block rounded-2xl bg-emerald px-5 py-4 text-sand shadow-sm transition hover:bg-emerald-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gold-light">Step 1</span>
        <span className="block font-serif text-xl font-semibold">Donate Now</span>
        <span className="mt-0.5 block text-sm text-sand/85">Give in increments of ${price.toLocaleString("en-US")}</span>
      </Link>
      <Link
        href="/pledge?for=others"
        className="block rounded-2xl border-2 border-emerald bg-white px-5 py-4 text-emerald shadow-sm transition hover:bg-sand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gold-ink">Step 2 · Invite others to good</span>
        <span className="block font-serif text-xl font-semibold">Pledge to invite family and friends</span>
        <span className="mt-0.5 block text-sm text-ink/80">Bring your close ones in with you</span>
      </Link>
    </div>
  );
}

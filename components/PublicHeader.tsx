import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="border-b border-sand-dark bg-sand/90">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-serif text-lg font-bold text-emerald focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
          ICCR <span className="text-gold-ink">313</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold" aria-label="Main">
          <Link href="/status" className="rounded-full px-3 py-2 text-emerald hover:bg-sand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
            Check my pledge
          </Link>
          <Link href="/pledge" className="btn-primary !px-4 !py-2">
            Pledge
          </Link>
        </nav>
      </div>
    </header>
  );
}

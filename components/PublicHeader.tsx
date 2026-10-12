import Image from "next/image";
import Link from "next/link";

export default function PublicHeader({ wide = false }: { wide?: boolean }) {
  return (
    <header className="border-b border-sand-dark bg-sand/90">
      <div className={`mx-auto flex items-center justify-between px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-emerald focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
          <Image src="/logo-mark.png" alt="" width={27} height={32} className="h-8 w-auto" />
          <span>ICCR <span className="text-gold-ink">313</span></span>
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

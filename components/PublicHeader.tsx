import Image from "next/image";
import Link from "next/link";

export default function PublicHeader({ wide = false }: { wide?: boolean }) {
  return (
    <header className="border-b border-sand-dark bg-sand/90">
      <div className={`mx-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-emerald focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald">
          <Image src="/logo-mark.png" alt="" width={27} height={32} className="h-8 w-auto" />
          <span>ICCR <span className="text-gold-ink">313</span></span>
        </Link>
        <nav className="flex w-full items-stretch gap-2 text-sm font-semibold sm:w-auto" aria-label="Main">
          <Link href="/pledge?pay=1" className="btn-primary flex-1 !px-4 !py-2 text-center leading-tight sm:flex-none">
            Donate Now
          </Link>
          <Link href="/pledge?for=others" className="btn-secondary flex-1 !px-4 !py-2 text-center leading-tight sm:flex-none">
            Pledge to invite family and friends
          </Link>
        </nav>
      </div>
    </header>
  );
}

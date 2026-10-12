import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export const metadata = { title: "Thank you | ICCR 313", robots: { index: false, follow: false } };

export default function Thanks() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="font-serif text-4xl font-bold text-emerald">JazakAllahu khayran</h1>
        <p className="mt-3 text-ink/80">
          Your payment is being confirmed. Your ticket will show as <b>Paid</b> within a minute or two.
        </p>
        <section className="mt-8 rounded-2xl border-2 border-emerald bg-white p-6 text-left shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Now bring your close ones</h2>
          <p className="mt-1 text-sm text-ink/80">
            Pledge tickets for your family and friends and send each person their ICCR number. Highly recommended.
          </p>
          <Link className="btn-primary mt-3 w-full" href="/pledge?for=others">Pledge for family &amp; friends</Link>
        </section>
        <Link className="btn-secondary mt-4" href="/status">Check my pledge</Link>
      </main>
    </>
  );
}

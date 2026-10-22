import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

export const metadata = { title: "Thank you | ICCR 313", robots: { index: false, follow: false } };

export default function Thanks({ searchParams }: { searchParams: { test?: string } }) {
  if (searchParams.test === "1") {
    return (
      <>
        <PublicHeader />
        <main className="mx-auto max-w-xl px-4 py-12 text-center">
          <h1 className="font-serif text-4xl font-bold text-emerald">Test gift received</h1>
          <p className="mt-3 text-ink/80">
            JazakAllahu khayran. Check your email for the receipt and your Stripe dashboard for the payment. No pledge was changed.
          </p>
        </main>
      </>
    );
  }
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="font-serif text-4xl font-bold text-emerald">JazakAllahu khayran</h1>
        <p className="mt-3 text-ink/80">
          Your donation is being confirmed. It will show as <b>Paid</b> on the tracker within a minute or two.
        </p>
        <Link className="btn-primary mt-5 w-full" href="/status">See my donation on the tracker</Link>
        <section className="mt-8 rounded-2xl border-2 border-emerald bg-white p-6 text-left shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Now pledge 5 or more from your family and friends</h2>
          <p className="mt-1 text-sm text-ink/80">
            The best next step: gather 5 or more donations from your circle, and send each person their own ICCR number.
            Highly recommended.
          </p>
          <Link className="btn-primary mt-3 w-full" href="/pledge?for=others">Pledge to invite family and friends</Link>
        </section>
      </main>
    </>
  );
}

import PublicHeader from "@/components/PublicHeader";
import PayClient from "./PayClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pay for a ticket | ICCR 313" };

export default function PayPage({ searchParams }: { searchParams: { t?: string; canceled?: string } }) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-emerald">Pay for a ticket</h1>
        <p className="mt-2 text-sm text-ink/80">
          Enter the ICCR ticket number you were given (like ICCR-4) and pay that exact ticket by card, Apple Pay or Google Pay.
        </p>
        {searchParams.canceled && <p className="mt-3 rounded-xl bg-sand-dark p-3 text-sm">No problem, your payment wasn&apos;t completed. You can try again below.</p>}
        <PayClient initial={typeof searchParams.t === "string" ? searchParams.t.slice(0, 200) : ""} />
      </main>
    </>
  );
}

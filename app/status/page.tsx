import PublicHeader from "@/components/PublicHeader";
import StatusLookup from "./StatusLookup";

export const metadata = { title: "Check my pledge | ICCR 313" };

export default function StatusPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-emerald">Check my pledge</h1>
        <p className="mt-2 text-sm text-ink/80">
          Enter the email you pledged with to see each of your tickets and whether it has been paid.
        </p>
        <StatusLookup />
      </main>
    </>
  );
}

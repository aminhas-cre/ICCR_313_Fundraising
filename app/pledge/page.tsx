import PublicHeader from "@/components/PublicHeader";
import { getSettings } from "@/lib/settings";
import PledgeForm from "./PledgeForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Make a pledge | ICCR 313" };

export default async function PledgePage({ searchParams }: { searchParams: { ref?: string } }) {
  const cfg = await getSettings();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-emerald">Be one of the 313</h1>
        <p className="mt-2 text-sm text-ink/80">
          Pledge ${cfg.ticket_price} per ticket. You&apos;ll get an ICCR ticket number to put in your Zelle memo, and a
          private page to track your pledge.
        </p>
        <PledgeForm price={cfg.ticket_price} zelle={cfg.zelle_email} initialRef={typeof searchParams.ref === "string" ? searchParams.ref.slice(0, 20) : ""} />
      </main>
    </>
  );
}

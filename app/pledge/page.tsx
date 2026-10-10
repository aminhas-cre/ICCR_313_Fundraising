import PublicHeader from "@/components/PublicHeader";
import { getSettings } from "@/lib/settings";
import { getSupabaseServerClient } from "@/lib/supabase";
import PledgeForm from "./PledgeForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Make a pledge | ICCR 313" };

export default async function PledgePage({ searchParams }: { searchParams: { pay?: string } }) {
  const cfg = await getSettings();
  const { count } = await getSupabaseServerClient().from("tickets").select("ticket_no", { count: "exact", head: true });
  const left = Math.max(0, cfg.goal_donors - (count ?? 0));
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-emerald">Be one of the {cfg.goal_donors}</h1>
        {left > 0 ? (
          <>
            <p className="mt-2 text-sm text-ink/80">
              Choose how many tickets you&apos;d like. Each is ${cfg.ticket_price} and gets its own ICCR number, so you
              can pay for yours or hand tickets to family and friends.
            </p>
            <PledgeForm price={cfg.ticket_price} zelle={cfg.zelle_email} left={left} payNow={searchParams.pay === "1"} />
          </>
        ) : (
          <p className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
            All {cfg.goal_donors} founding tickets are taken, alhamdulillah. The {cfg.goal_donors} are the spark, not the
            ceiling. Jazakum Allahu khayran!
          </p>
        )}
      </main>
    </>
  );
}

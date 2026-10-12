import PublicHeader from "@/components/PublicHeader";
import { getSettings } from "@/lib/settings";
import { getSupabaseServerClient } from "@/lib/supabase";
import PledgeForm from "./PledgeForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Make a pledge | ICCR 313" };

export default async function PledgePage({ searchParams }: { searchParams: { pay?: string; for?: string } }) {
  const cfg = await getSettings();
  const { count } = await getSupabaseServerClient().from("tickets").select("ticket_no", { count: "exact", head: true });
  const left = Math.max(0, cfg.goal_donors - (count ?? 0));
  // "self" = Step 1 (pay for my own ticket), "others" = Step 2 (family & friends).
  const mode: "self" | "others" | "default" = searchParams.pay === "1" ? "self" : searchParams.for === "others" ? "others" : "default";

  const heading = mode === "self" ? "Pay for my ticket" : mode === "others" ? "Pledge for family & friends" : `Be one of the ${cfg.goal_donors}`;
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-emerald">{heading}</h1>
        {left > 0 ? (
          <>
            {mode === "self" && (
              <p className="mt-2 text-sm text-ink/80">
                Step 1: cover your own ${cfg.ticket_price} ticket. You&apos;ll get your ICCR ticket number. After this, please
                pledge tickets for your family and friends too. It makes a real difference.
              </p>
            )}
            {mode === "others" && (
              <div className="mt-2 space-y-2 text-sm text-ink/80">
                <p>
                  Step 2, highly recommended: reserve tickets for the people close to you. Each ticket gets its own ICCR number.
                  Send each person their number and they pay that exact ticket (Zelle memo or card).
                </p>
                <p className="rounded-xl bg-sand-dark p-3">
                  Haven&apos;t covered your own ticket yet? <a className="font-semibold text-emerald underline" href="/pledge?pay=1">Pay for yours first</a>.
                </p>
              </div>
            )}
            {mode === "default" && (
              <p className="mt-2 text-sm text-ink/80">
                Choose how many tickets you&apos;d like. Each is ${cfg.ticket_price} and gets its own ICCR number. Pay for your own
                first, then pledge tickets for your family and friends.
              </p>
            )}
            <PledgeForm
              price={cfg.ticket_price}
              zelle={cfg.zelle_email}
              left={left}
              mode={mode}
              initialCount={mode === "others" ? Math.min(4, left) : 1}
            />
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

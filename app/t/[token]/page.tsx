import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import TicketList from "@/components/TicketList";
import ShareButtons from "@/components/ShareButtons";
import { loadByToken } from "@/lib/pledgeView";

export const dynamic = "force-dynamic";
export const metadata = { title: "My pledge | ICCR 313", robots: { index: false, follow: false } };

export default async function PrivateStatus({ params }: { params: { token: string } }) {
  const view = await loadByToken(params.token);
  if (!view) notFound();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <TicketList initial={view} />
        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Share with family and friends</h2>
          <p className="mt-1 text-sm text-ink/80">Every person you bring in multiplies your reward, in sha Allah.</p>
          <div className="mt-3"><ShareButtons /></div>
        </section>
      </main>
    </>
  );
}

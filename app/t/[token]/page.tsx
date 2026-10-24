import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import TicketList from "@/components/TicketList";
import ShareFooter from "@/components/ShareFooter";
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
      </main>
      <ShareFooter />
    </>
  );
}

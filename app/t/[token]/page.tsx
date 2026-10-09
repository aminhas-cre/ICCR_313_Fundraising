import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import StatusCard from "@/components/StatusCard";
import ShareButtons from "@/components/ShareButtons";
import { loadView } from "@/lib/pledgeView";

export const dynamic = "force-dynamic";
export const metadata = { title: "My pledge | ICCR 313", robots: { index: false, follow: false } };

export default async function PrivateStatus({ params }: { params: { token: string } }) {
  const found = await loadView({ token: params.token });
  if (!found) notFound();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-emerald">Assalamu Alaikum, {found.view.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-ink/80">Bookmark this page. It always shows your latest pledge status.</p>
        <div className="mt-6"><StatusCard v={found.view} /></div>
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Bring 5 people</h2>
          <p className="mt-1 text-sm text-ink/80">Share your personal link. People who pledge through it are credited to you, in sha Allah.</p>
          <div className="mt-3"><ShareButtons refCode={found.view.ticket} /></div>
        </section>
      </main>
    </>
  );
}

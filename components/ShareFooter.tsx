import ShareButtons from "@/components/ShareButtons";

// Standing reminder at the bottom of every public page: share and invite family and friends.
export default function ShareFooter() {
  return (
    <section aria-label="Share the 313" className="mx-auto max-w-xl px-4 pb-12">
      <div className="rounded-2xl border-2 border-emerald bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-xl font-semibold text-emerald">Share the 313 with family and friends</h2>
        <p className="mt-1 text-sm text-ink/80">Every person you bring in multiplies your reward, in sha Allah.</p>
        <div className="mt-3"><ShareButtons /></div>
      </div>
    </section>
  );
}

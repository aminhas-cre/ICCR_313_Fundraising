import { redirect } from "next/navigation";

// Old Phase 1 URL; payments are now per-ticket.
export default function PaymentsRedirect() {
  redirect("/admin/tickets");
}

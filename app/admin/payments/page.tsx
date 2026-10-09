import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default function PaymentsPage({ searchParams }: { searchParams: { ticket?: string } }) {
  if (!isAdmin()) redirect("/admin/login");
  return <PaymentsClient initialTicket={typeof searchParams.ticket === "string" ? searchParams.ticket : ""} />;
}

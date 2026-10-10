import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import TicketsClient from "./TicketsClient";

export const dynamic = "force-dynamic";

export default function TicketsPage() {
  if (!isAdmin()) redirect("/admin/login");
  return <TicketsClient />;
}

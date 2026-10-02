import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!isAdmin()) redirect("/admin/login");
  return <AdminClient />;
}

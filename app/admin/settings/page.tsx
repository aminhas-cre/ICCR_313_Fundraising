import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  if (!isAdmin()) redirect("/admin/login");
  return <SettingsClient />;
}

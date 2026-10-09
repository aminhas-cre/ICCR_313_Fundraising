import { getSupabaseServerClient } from "./supabase";

// Simple per-IP throttle backed by request_log. Fails open if the DB errors,
// so a logging hiccup never blocks a real donor.
export async function isLimited(req: Request, bucket: string, max: number, windowMin = 10) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const key = `${bucket}:${ip}`;
    const sb = getSupabaseServerClient();
    const since = new Date(Date.now() - windowMin * 60_000).toISOString();
    const { count } = await sb
      .from("request_log")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", since);
    if ((count ?? 0) >= max) return true;
    await sb.from("request_log").insert({ key });
    if (Math.random() < 0.05) {
      await sb.from("request_log").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
    }
    return false;
  } catch {
    return false;
  }
}

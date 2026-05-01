import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResearchLockerClient from "./ResearchLockerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Research Locker | Admin" };

export default async function ResearchLockerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

  const { data: entries } = await supabase
    .from("research_entries")
    .select("id, type, target_name, source_type, source_url, image_url, raw_text, extracted_data, tags, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  return <ResearchLockerClient initialEntries={entries ?? []} />;
}

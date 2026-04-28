import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BatchGuideGenerator from "./BatchGuideGenerator";

export const dynamic = "force-dynamic";
export const metadata = { title: "Generate Guides | Admin" };

export default async function BatchGenerateGuidesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    redirect("/app/dashboard");
  }

  return <BatchGuideGenerator />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomepageFeaturedManager from "./HomepageFeaturedManager";

export const metadata = { title: "Weekly Top Games | Admin" };

export default async function HomepageFeaturedAdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");
  return <HomepageFeaturedManager />;
}

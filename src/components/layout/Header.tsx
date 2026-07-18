import { createClient } from "@/lib/supabase/server";
import HeaderClient from "./HeaderClient";

export default async function Header() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <HeaderClient account={null} />;

    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle();

    return <HeaderClient account={{ label: profile?.display_name || profile?.username || "Account" }} />;
}

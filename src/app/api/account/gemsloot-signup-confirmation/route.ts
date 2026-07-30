import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

    const { data: gemsloot, error: platformError } = await supabase
        .from("platforms")
        .select("id")
        .eq("slug", "gemsloot")
        .maybeSingle();
    if (platformError) return NextResponse.json({ error: "internal" }, { status: 500 });
    if (!gemsloot) return NextResponse.json({ error: "gemsloot_not_found" }, { status: 404 });

    const { data: connection, error: connectionError } = await supabase
        .from("user_gpt_partner_accounts")
        .select("id, last_signup_click_at")
        .eq("user_id", user.id)
        .eq("platform_id", gemsloot.id)
        .maybeSingle();
    if (connectionError) return NextResponse.json({ error: "internal" }, { status: 500 });
    if (!connection?.last_signup_click_at) return NextResponse.json({ error: "signup_click_required" }, { status: 409 });

    const { error: updateError } = await supabase
        .from("user_gpt_partner_accounts")
        .update({ signup_confirmed_at: new Date().toISOString() })
        .eq("id", connection.id)
        .eq("user_id", user.id);
    if (updateError) return NextResponse.json({ error: "internal" }, { status: 500 });

    return NextResponse.json({ ok: true });
}

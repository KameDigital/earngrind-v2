import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "editor";

export type AdminAuthResult =
    | {
        ok: true;
        supabase: ReturnType<typeof createClient>;
        userId: string;
        role: AdminRole;
    }
    | {
        ok: false;
        status: 401 | 403;
        error: "Unauthorized" | "Forbidden";
    };

export async function requireAdminOrEditor(): Promise<AdminAuthResult> {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { ok: false, status: 401, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = String(profile?.role ?? "");
    if (role !== "admin" && role !== "editor") {
        return { ok: false, status: 403, error: "Forbidden" };
    }

    return {
        ok: true,
        supabase,
        userId: user.id,
        role,
    };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateProfileInput } from "@/lib/account-validation";

export type ProfileActionState = { error?: string; success?: string };

export async function saveProfile(_previousState: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
    const input = validateProfileInput(formData);
    if (!input.ok) return { error: input.error };

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Your session has expired. Please sign in again." };

    const { error } = await supabase.from("profiles").update(input.value).eq("id", user.id);
    if (error?.code === "23505") return { error: "That username is already in use." };
    if (error) return { error: "We could not save your settings. Please try again." };

    revalidatePath("/account");
    revalidatePath("/account/settings");
    revalidatePath("/");
    return { success: "Settings saved." };
}

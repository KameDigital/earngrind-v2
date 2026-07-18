"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSafeReturnPath, validateCredentials } from "@/lib/account-validation";

function loginUrl(params: Record<string, string>) {
    return `/login?${new URLSearchParams(params).toString()}`;
}

export async function login(formData: FormData) {
    const next = getSafeReturnPath(formData.get("next"));
    const credentials = validateCredentials(formData);
    if (!credentials.ok) redirect(loginUrl({ error: credentials.error, next }));

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(credentials.value);
    if (error) redirect(loginUrl({ error: "Unable to sign in with those credentials.", next }));
    redirect(next);
}

export async function signup(formData: FormData) {
    const next = getSafeReturnPath(formData.get("next"));
    const credentials = validateCredentials(formData);
    if (!credentials.ok) redirect(`/signup?${new URLSearchParams({ error: credentials.error, next })}`);

    const origin = headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const emailRedirectTo = new URL("/auth/callback", origin);
    emailRedirectTo.searchParams.set("next", next);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
        ...credentials.value,
        options: { emailRedirectTo: emailRedirectTo.toString() },
    });
    if (error) redirect(`/signup?${new URLSearchParams({ error: "Unable to create your account.", next })}`);
    if (data.session) redirect(next);
    redirect(loginUrl({ message: "Check your email to confirm your account, then sign in.", next }));
}

export async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/");
}

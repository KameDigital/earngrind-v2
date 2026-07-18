import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EARNLAB_COUNTRY_NAMES, EARNLAB_GALLERY_COUNTRIES } from "@/lib/earnlab-countries";
import AccountSettingsForm from "@/components/account/AccountSettingsForm";

export const metadata = { title: "Account settings", robots: { index: false, follow: false } };

export default async function AccountSettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/account/settings");
    const { data: profile } = await supabase.from("profiles").select("username, display_name, avatar_url, country_code, preferred_device").eq("id", user.id).maybeSingle();
    const countries = EARNLAB_GALLERY_COUNTRIES.map((code) => ({ code, name: EARNLAB_COUNTRY_NAMES[code] }));
    return <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Private account</p><h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-ink)]">Settings</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Country is saved as a private account preference. It does not change public offer URLs or search query country filters.</p><AccountSettingsForm profile={profile ?? {}} countries={countries} /></section>;
}

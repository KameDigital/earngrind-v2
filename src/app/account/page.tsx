import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEarnLabCountryName, isSupportedEarnLabCountry } from "@/lib/earnlab-countries";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/account");
    const { data: profile } = await supabase.from("profiles").select("username, display_name, avatar_url, country_code, preferred_device").eq("id", user.id).maybeSingle();
    const country = profile?.country_code && isSupportedEarnLabCountry(profile.country_code) ? getEarnLabCountryName(profile.country_code) : "Not set";
    return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Private account</p><h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-ink)]">{profile?.display_name || profile?.username || user.email}</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Your browsing preferences are private and only visible to you.</p></div><Link href="/account/settings" className="rounded-none bg-[var(--brand-ink)] px-4 py-2 text-sm font-bold text-white">Settings</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><Summary label="Country preference" value={country} /><Summary label="Preferred device" value={formatDevice(profile?.preferred_device)} /></div><div className="mt-8 grid gap-4 md:grid-cols-3"><EmptyCard title="Favorite offers" copy="Favorite offers will appear here when that private feature is available." /><EmptyCard title="Recently viewed offers" copy="Private recently viewed offers are coming soon." /><EmptyCard title="Tracked offers" copy="Offer tracking is not active yet. You’ll be able to manage it here." /></div></section>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="border border-[var(--border-default)] bg-white p-5"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</p><p className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">{value}</p></div>; }
function EmptyCard({ title, copy }: { title: string; copy: string }) { return <div className="border border-[var(--border-default)] bg-[var(--surface-muted)] p-5"><h2 className="font-extrabold text-[var(--brand-ink)]">{title}</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">{copy}</p></div>; }
function formatDevice(value?: string | null) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : "All devices"; }

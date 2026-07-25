import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEarnLabCountryName, isSupportedEarnLabCountry } from "@/lib/earnlab-countries";
import AccountOfferDashboard from "@/components/account/AccountOfferDashboard";
import AccountPartnerSites from "@/components/account/AccountPartnerSites";
import { savedOfferFromRow } from "@/lib/account-offers";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/account");
    const [{ data: profile }, favorites, views, tracking, { data: partnerAccounts }] = await Promise.all([
        supabase.from("profiles").select("username, display_name, avatar_url, country_code, preferred_device").eq("id", user.id).maybeSingle(),
        supabase.from("user_offer_favorites").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(6),
        supabase.from("user_offer_views").select("*", { count: "exact" }).order("last_viewed_at", { ascending: false }).limit(6),
        supabase.from("user_offer_tracking").select("*", { count: "exact" }).order("tracking_started_at", { ascending: false }).limit(6),
        supabase.from("user_gpt_partner_accounts").select("connected_at, last_signup_click_at, platforms!inner(slug)").order("connected_at", { ascending: false }),
    ]);
    const country = profile?.country_code && isSupportedEarnLabCountry(profile.country_code) ? getEarnLabCountryName(profile.country_code) : "Not set";
    const favoriteRows = (favorites.data ?? []).map((row) => savedOfferFromRow(row));
    const viewRows = (views.data ?? []).map((row) => savedOfferFromRow(row));
    const trackingRows = (tracking.data ?? []).map((row) => savedOfferFromRow(row));
    const partnerConnections = (partnerAccounts ?? []).flatMap((row) => {
        const platform = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms;
        return platform?.slug && typeof row.connected_at === "string" && typeof row.last_signup_click_at === "string"
            ? [{ slug: platform.slug, connectedAt: row.connected_at, lastSignupClickAt: row.last_signup_click_at }]
            : [];
    });
    return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Private account</p><h1 className="mt-2 break-words text-3xl font-extrabold text-[var(--brand-ink)]">{profile?.display_name || profile?.username || user.email}</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Your browsing preferences are private and only visible to you.</p></div><Link href="/account/settings" className="rounded-none bg-[var(--brand-ink)] px-4 py-2 text-sm font-bold text-white">Settings</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><Summary label="Country preference" value={country} /><Summary label="Preferred device" value={formatDevice(profile?.preferred_device)} /></div><AccountOfferDashboard favorites={favoriteRows} views={viewRows} tracking={trackingRows} counts={{ favorites: favorites.count ?? favoriteRows.length, views: views.count ?? viewRows.length, tracking: tracking.count ?? trackingRows.length }} /><AccountPartnerSites connections={partnerConnections} /></section>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="border border-[var(--border-default)] bg-white p-5"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</p><p className="mt-2 text-lg font-extrabold text-[var(--brand-ink)]">{value}</p></div>; }
function formatDevice(value?: string | null) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : "All devices"; }
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEarnLabCountryName, isSupportedEarnLabCountry } from "@/lib/earnlab-countries";
import AccountAppShell from "@/components/account/AccountAppShell";
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
    const partnerConnections = (partnerAccounts ?? []).flatMap((row) => { const platform = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms; return platform?.slug && typeof row.connected_at === "string" && typeof row.last_signup_click_at === "string" ? [{ slug: platform.slug, connectedAt: row.connected_at, lastSignupClickAt: row.last_signup_click_at }] : []; });
    const country = profile?.country_code && isSupportedEarnLabCountry(profile.country_code) ? getEarnLabCountryName(profile.country_code) : "Not set";
    const accountName = profile?.display_name || profile?.username || user.email;
    const favoriteRows = (favorites.data ?? []).map((row) => savedOfferFromRow(row));
    const viewRows = (views.data ?? []).map((row) => savedOfferFromRow(row));
    const trackingRows = (tracking.data ?? []).map((row) => savedOfferFromRow(row));

    return <AccountAppShell connectedCount={partnerConnections.length}><div className="mx-auto max-w-[1600px] space-y-10"><section className="account-surface p-6 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Private account</p><span className="rounded border border-lime-300 bg-lime-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Private session active</span></div><div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="min-w-0"><h1 className="break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{accountName}</h1><p className="mt-1 text-sm text-slate-500">Your browsing preferences are private and only visible to you.</p></div><Link href="/account/settings" className="rounded bg-black px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-lime-400 hover:text-black">Settings</Link></div><div className="mt-6 border-t border-slate-200 pt-4"><div className="flex justify-between text-xs"><span className="font-bold text-slate-800">Account preferences</span><span className="text-slate-500">Update your country and device in settings</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" /></div></div></section><section className="grid gap-4 md:grid-cols-2"><PreferenceCard label="Country preference" value={country} detail="Filtered for country routes" /><PreferenceCard label="Preferred device" value={formatDevice(profile?.preferred_device)} detail="Optimized device matching" /></section><AccountOfferDashboard favorites={favoriteRows} views={viewRows} tracking={trackingRows} counts={{ favorites: favorites.count ?? favoriteRows.length, views: views.count ?? viewRows.length, tracking: tracking.count ?? trackingRows.length }} /><AccountPartnerSites connections={partnerConnections} /></div></AccountAppShell>;
}

function PreferenceCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="account-surface flex min-h-36 flex-col justify-between p-6"><div><p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-950">{value}</p></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><p className="text-slate-500">{detail}</p><Link href="/account/settings" className="font-extrabold text-slate-950 underline decoration-lime-400 underline-offset-4">Edit</Link></div></article>; }
function formatDevice(value?: string | null) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : "All"; }

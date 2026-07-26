import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicOfferCountryByCode } from "@/lib/earnlab-countries";
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
    const partnerConnections = (partnerAccounts ?? []).flatMap((row) => {
        const platform = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms;
        return platform?.slug && typeof row.connected_at === "string" && typeof row.last_signup_click_at === "string"
            ? [{ slug: platform.slug, connectedAt: row.connected_at, lastSignupClickAt: row.last_signup_click_at }]
            : [];
    });
    const country = getPublicOfferCountryByCode(profile?.country_code);
    const accountName = profile?.display_name || profile?.username || user.email;
    const favoriteRows = (favorites.data ?? []).map((row) => savedOfferFromRow(row));
    const viewRows = (views.data ?? []).map((row) => savedOfferFromRow(row));
    const trackingRows = (tracking.data ?? []).map((row) => savedOfferFromRow(row));

    return (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="space-y-8 sm:space-y-10">
                <section className="border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]"><span className="h-2 w-2 bg-[var(--success)]" aria-hidden="true" />Private account</p>
                        <span className="border border-lime-200 bg-lime-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-ink)]">Private session active</span>
                    </div>
                    <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div className="min-w-0"><h1 className="break-words text-2xl font-extrabold tracking-tight text-[var(--brand-ink)] sm:text-3xl">{accountName}</h1><p className="mt-1.5 text-sm text-[var(--text-secondary)]">Your browsing preferences and account activity are visible only to you.</p></div>
                        <Link href="/account/settings" className="inline-flex shrink-0 items-center justify-center bg-[var(--brand-ink)] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--brand-lime)] hover:text-[var(--brand-ink)]">Manage settings</Link>
                    </div>
                    <div className="mt-6 border-t border-[var(--border-default)] pt-4"><p className="text-xs text-[var(--text-secondary)]"><span className="font-bold text-[var(--brand-ink)]">Personalize your experience.</span> Choose a country and device to tailor the routes you browse.</p></div>
                </section>
                <section className="grid gap-4 md:grid-cols-2"><PreferenceCard label="Country preference" value={country?.name ?? "Not set"} detail="Used to help you compare country-appropriate routes." /><PreferenceCard label="Preferred device" value={formatDevice(profile?.preferred_device)} detail="Used to surface routes that match how you play." /></section>
                <AccountOfferDashboard favorites={favoriteRows} views={viewRows} tracking={trackingRows} counts={{ favorites: favorites.count ?? favoriteRows.length, views: views.count ?? viewRows.length, tracking: tracking.count ?? trackingRows.length }} />
                <AccountPartnerSites connections={partnerConnections} />
            </div>
        </section>
    );
}

function PreferenceCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="flex min-h-44 flex-col justify-between border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"><div><p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</p><p className="mt-2 text-xl font-extrabold text-[var(--brand-ink)]">{value}</p></div><div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--border-default)] pt-3 text-xs"><p className="text-[var(--text-secondary)]">{detail}</p><Link href="/account/settings" className="shrink-0 font-bold text-[var(--brand-ink)] underline decoration-[var(--brand-lime)] underline-offset-4">Edit</Link></div></article>; }
function formatDevice(value?: string | null) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : "All devices"; }
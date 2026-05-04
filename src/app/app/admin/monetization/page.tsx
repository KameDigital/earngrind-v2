import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    emptyGuideEventSummary,
    formatPercent,
    summarizeEventsByGuide,
    type GuideEventRow,
    type GuideEventSummary,
} from "@/lib/guide-event-stats";
import { matchOffersToGuide, type GuideOfferMatch } from "@/lib/guide-offer-matcher";
import { getRecentOutboundRecords, type CanonicalOutboundRecord } from "@/lib/outbound-reporting";

export const dynamic = "force-dynamic";
export const metadata = { title: "Monetization | Admin" };

type Priority = "high" | "medium" | "low";
type ActionCategory = "conversion" | "offer" | "content" | "trust" | "analytics";

type GuideRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
    guide_type: string | null;
    keyword_target: string | null;
    max_payout_usd: number | null;
    game_id: string | null;
    primary_offer_id?: string | null;
    disable_auto_offer_matching?: boolean | null;
    games?: { id: string | null; name: string | null; slug: string | null } | null;
};

type OfferRow = {
    id: string;
    title: string | null;
    game_id: string | null;
    game_name: string | null;
    game_slug: string | null;
    platform_id: string | null;
    platform_name: string | null;
    provider_name: string | null;
    payout_usd: number | null;
    total_payout_usd: number | null;
    status: string | null;
    source: string | null;
    category: string | null;
    goal_text: string | null;
    updated_at: string | null;
};

type PlatformRow = {
    id: string;
    name: string;
    slug: string;
    affiliate_template: string | null;
    is_active: boolean | null;
    platform_kind: string | null;
};

type MonetizationAction = {
    id: string;
    priority: Priority;
    category: ActionCategory;
    title: string;
    reason: string;
    target: string;
    source: string;
    recommendedAction: string;
    metric: string;
    href: string;
    buttonLabel: string;
};

const PRIORITY_WEIGHT: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

const CATEGORY_LABELS: Record<ActionCategory, string> = {
    conversion: "Conversion",
    offer: "Offer",
    content: "Content",
    trust: "Trust",
    analytics: "Analytics",
};

const PRIORITY_STYLES: Record<Priority, string> = {
    high: "bg-red-50 text-red-700 ring-red-200",
    medium: "bg-amber-50 text-amber-700 ring-amber-200",
    low: "bg-gray-100 text-gray-600 ring-gray-200",
};

function daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function money(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return `$${value.toFixed(2)}`;
}

function pct(value: number) {
    return formatPercent(value);
}

function outboundKey(record: CanonicalOutboundRecord) {
    return record.offer_id ?? `${record.platform_name ?? ""}:${record.game_title ?? ""}:${record.offer_title ?? ""}`;
}

function buildGuideActions({
    guide,
    stats,
    matches,
}: {
    guide: GuideRow;
    stats: GuideEventSummary;
    matches: GuideOfferMatch[];
}): MonetizationAction[] {
    const actions: MonetizationAction[] = [];
    const outboundClicks = stats.offerClicks + stats.platformClicks;
    const editHref = `/app/admin/guides/${guide.id}/edit`;

    if (stats.views >= 50 && stats.ctaClicks === 0) {
        actions.push({
            id: `guide-no-cta-${guide.id}`,
            priority: stats.views >= 150 ? "high" : "medium",
            category: "conversion",
            title: "Guide has traffic but no CTA clicks",
            reason: `${stats.views} guide views and 0 CTA clicks in the last 30 days.`,
            target: guide.title,
            source: "Guide Events",
            recommendedAction: "Move a matched offer CTA higher, test stronger wording, and check that the CTA is visible on mobile.",
            metric: `${stats.views} views`,
            href: editHref,
            buttonLabel: "Open guide editor",
        });
    }

    if (stats.ctaClicks >= 5 && outboundClicks === 0) {
        actions.push({
            id: `cta-no-offer-${guide.id}`,
            priority: "high",
            category: "conversion",
            title: "CTA clicks are not becoming offer clicks",
            reason: `${stats.ctaClicks} CTA clicks but no outbound offer/platform clicks.`,
            target: guide.title,
            source: "Guide Events",
            recommendedAction: "Check outbound routes, CTA hrefs, and whether the dynamic offer block is using a tracked /go route.",
            metric: `${stats.ctaClicks} CTA clicks`,
            href: editHref,
            buttonLabel: "Inspect CTA setup",
        });
    }

    if (stats.views >= 100 && stats.ctaCtr < 0.02) {
        actions.push({
            id: `weak-ctr-${guide.id}`,
            priority: "high",
            category: "conversion",
            title: "Weak guide CTA conversion",
            reason: `${stats.views} views with ${pct(stats.ctaCtr)} CTA CTR.`,
            target: guide.title,
            source: "Guide Analytics",
            recommendedAction: "Test a clearer payout-led CTA and add a trust note beside the outbound button.",
            metric: pct(stats.ctaCtr),
            href: "/app/admin/guides/analytics",
            buttonLabel: "View analytics",
        });
    }

    if (guide.disable_auto_offer_matching) {
        actions.push({
            id: `auto-match-disabled-${guide.id}`,
            priority: stats.views >= 50 ? "medium" : "low",
            category: "offer",
            title: "Auto offer matching is disabled",
            reason: "The guide cannot automatically show the best current offer unless a manual primary offer is set.",
            target: guide.title,
            source: "Guide Offer Matching",
            recommendedAction: "Set a manual primary offer or re-enable auto matching.",
            metric: `${matches.length} matched alternatives`,
            href: editHref,
            buttonLabel: "Set primary offer",
        });
    } else if (matches.length === 0) {
        actions.push({
            id: `no-match-${guide.id}`,
            priority: stats.views > 0 ? "medium" : "low",
            category: "offer",
            title: "No relevant offer match found",
            reason: "The dynamic CTA will fall back to the general offers page instead of a relevant payout.",
            target: guide.title,
            source: "Guide Offer Matcher",
            recommendedAction: "Check the guide game link, keyword target, or set a manual primary offer.",
            metric: "Fallback CTA risk",
            href: editHref,
            buttonLabel: "Fix matching",
        });
    }

    const bestMatch = matches[0];
    const guidePayout = Number(guide.max_payout_usd ?? 0);
    if (bestMatch?.payout && bestMatch.payout > Math.max(guidePayout, 0) + 10) {
        actions.push({
            id: `higher-payout-match-${guide.id}`,
            priority: stats.views >= 25 ? "medium" : "low",
            category: "offer",
            title: "Matched offer payout is higher than guide payout",
            reason: `The best matched offer is ${money(bestMatch.payout)}, while the guide payout field is ${money(guidePayout)}.`,
            target: guide.title,
            source: "Guide Offer Matcher",
            recommendedAction: "Refresh the guide payout copy and metadata so the page advertises the current best route.",
            metric: money(bestMatch.payout),
            href: editHref,
            buttonLabel: "Update payout copy",
        });
    }

    const fallback = stats.ctaPlacementPerformance.find((placement) => placement.id === "fallback");
    const placementClicks = stats.ctaPlacementPerformance.reduce((sum, row) => sum + row.ctaClicks, 0);
    if (fallback && fallback.ctaClicks >= 3 && fallback.ctaClicks / Math.max(placementClicks, 1) >= 0.25) {
        actions.push({
            id: `fallback-high-${guide.id}`,
            priority: "medium",
            category: "offer",
            title: "Fallback CTA is used often",
            reason: `${fallback.ctaClicks} fallback CTA clicks suggests offer matching needs work.`,
            target: guide.title,
            source: "CTA Placement Analytics",
            recommendedAction: "Improve offer matching or set a manual primary offer for this guide.",
            metric: `${fallback.ctaClicks} fallback clicks`,
            href: editHref,
            buttonLabel: "Review matches",
        });
    }

    return actions;
}

function uniqueActions(actions: MonetizationAction[]) {
    const seen = new Set<string>();
    return actions.filter((action) => {
        if (seen.has(action.id)) return false;
        seen.add(action.id);
        return true;
    });
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
            {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
        </div>
    );
}

function ActionRow({ action }: { action: MonetizationAction }) {
    return (
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ring-1 ${PRIORITY_STYLES[action.priority]}`}>
                            {action.priority}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                            {CATEGORY_LABELS[action.category]}
                        </span>
                        <span className="text-xs font-semibold text-gray-400">{action.source}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-extrabold text-gray-900">{action.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-gray-700">{action.target}</p>
                    <p className="mt-2 text-sm text-gray-500">{action.reason}</p>
                    <p className="mt-2 text-sm text-gray-700">
                        <span className="font-bold">Recommended:</span> {action.recommendedAction}
                    </p>
                </div>
                <div className="shrink-0 lg:w-44">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-right">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Signal</div>
                        <div className="mt-1 text-lg font-extrabold text-gray-900">{action.metric}</div>
                    </div>
                    <Link
                        href={action.href}
                        className="mt-3 inline-flex w-full justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800"
                    >
                        {action.buttonLabel}
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default async function MonetizationCommandPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/app/dashboard");

    const since = daysAgo(30);
    const [guidesResult, eventsResult, offersResult, platformsResult, outboundRecords] = await Promise.all([
        supabase
            .from("guides")
            .select("id, title, slug, status, guide_type, keyword_target, max_payout_usd, game_id, primary_offer_id, disable_auto_offer_matching, games(id, name, slug)")
            .eq("status", "published")
            .order("updated_at", { ascending: false })
            .limit(500),
        supabase
            .from("guide_events")
            .select("guide_id, guide_slug, event_type, target_url, metadata, created_at")
            .gte("created_at", since)
            .limit(25000),
        supabase
            .from("unified_offers_view")
            .select("id, title, game_id, game_name, game_slug, platform_id, platform_name, provider_name, payout_usd, total_payout_usd, status, source, category, goal_text, updated_at")
            .order("total_payout_usd", { ascending: false })
            .limit(500),
        supabase
            .from("platforms")
            .select("id, name, slug, affiliate_template, is_active, platform_kind")
            .eq("is_active", true)
            .order("trust_score", { ascending: false })
            .limit(250),
        getRecentOutboundRecords({ limit: 500, supabase }),
    ]);

    const guides = ((guidesResult.data ?? []) as Array<Omit<GuideRow, "games"> & { games?: GuideRow["games"] | GuideRow["games"][] }>)
        .map((guide) => ({
            ...guide,
            games: Array.isArray(guide.games) ? guide.games[0] ?? null : guide.games ?? null,
        }));
    const events = (eventsResult.data ?? []) as GuideEventRow[];
    const offers = (offersResult.data ?? []) as OfferRow[];
    const platforms = (platformsResult.data ?? []) as PlatformRow[];
    const statsByGuide = summarizeEventsByGuide(events);

    const guideActions = guides.flatMap((guide) => {
        const stats = statsByGuide.get(guide.id) ?? statsByGuide.get(guide.slug) ?? emptyGuideEventSummary();
        const matches = matchOffersToGuide({
            guide,
            offers,
            guideEventStats: stats,
        });
        return buildGuideActions({ guide, stats, matches });
    });

    const outboundCounts = outboundRecords.reduce((acc, record) => {
        const key = outboundKey(record);
        if (!key) return acc;
        acc.set(key, (acc.get(key) ?? 0) + 1);
        return acc;
    }, new Map<string, number>());

    const clickedOfferIds = new Set(outboundRecords.map((record) => record.offer_id).filter(Boolean));
    const highPayoutNoClicks = offers
        .filter((offer) => Number(offer.total_payout_usd ?? offer.payout_usd ?? 0) >= 100)
        .filter((offer) => !clickedOfferIds.has(offer.id))
        .slice(0, 8)
        .map((offer): MonetizationAction => ({
            id: `high-payout-no-click-${offer.id}`,
            priority: Number(offer.total_payout_usd ?? offer.payout_usd ?? 0) >= 300 ? "high" : "medium",
            category: "offer",
            title: "High-payout offer has no recent clicks",
            reason: `${offer.game_name ?? offer.title ?? "Offer"} pays ${money(Number(offer.total_payout_usd ?? offer.payout_usd ?? 0))} but has no recent outbound clicks in the loaded stream.`,
            target: offer.game_name ?? offer.title ?? offer.id,
            source: "Unified Offers + Outbound",
            recommendedAction: "Link this offer from a relevant guide, set it as a manual primary offer, or create/refresh the game page content.",
            metric: money(Number(offer.total_payout_usd ?? offer.payout_usd ?? 0)),
            href: offer.game_slug ? `/games/${offer.game_slug}` : "/app/admin/site-offers",
            buttonLabel: offer.game_slug ? "Open game page" : "Open offers",
        }));

    const gptAffiliateSlugs = new Set(["kashkick", "swagbucks", "inboxdollars", "mypoints", "prizerebel", "scrambly", "gain-gg", "gemsloot"]);
    const missingAffiliatePlatforms = platforms
        .filter((platform) => platform.platform_kind === "gpt_site" || gptAffiliateSlugs.has(platform.slug))
        .filter((platform) => !platform.affiliate_template?.trim())
        .slice(0, 8)
        .map((platform): MonetizationAction => ({
            id: `missing-affiliate-${platform.id}`,
            priority: gptAffiliateSlugs.has(platform.slug) ? "high" : "medium",
            category: "trust",
            title: "GPT platform is missing an affiliate URL",
            reason: `${platform.name} is active, but affiliate_template is empty. Public CTA links may fall back to an unmonetized destination.`,
            target: platform.name,
            source: "Platforms",
            recommendedAction: "Add a tracked affiliate_template or disable the platform until a monetized route is ready.",
            metric: "No affiliate URL",
            href: "/app/admin",
            buttonLabel: "Open admin",
        }));

    const topClicked = Array.from(outboundCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const actions = uniqueActions([...guideActions, ...highPayoutNoClicks, ...missingAffiliatePlatforms])
        .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || a.category.localeCompare(b.category))
        .slice(0, 40);

    const totalViews = guides.reduce((sum, guide) => {
        const stats = statsByGuide.get(guide.id) ?? statsByGuide.get(guide.slug) ?? emptyGuideEventSummary();
        return sum + stats.views;
    }, 0);
    const totalCtaClicks = guides.reduce((sum, guide) => {
        const stats = statsByGuide.get(guide.id) ?? statsByGuide.get(guide.slug) ?? emptyGuideEventSummary();
        return sum + stats.ctaClicks;
    }, 0);
    const totalOutbound = outboundRecords.length;
    const highPriorityCount = actions.filter((action) => action.priority === "high").length;
    const conversionFixes = actions.filter((action) => action.category === "conversion").length;
    const offerFixes = actions.filter((action) => action.category === "offer").length;
    const missingAffiliateCount = missingAffiliatePlatforms.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Revenue command layer</p>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">Monetization Command Center</h1>
                    <p className="mt-1 max-w-3xl text-sm text-gray-500">
                        Prioritized actions from guide events, CTA performance, offer matching, and outbound clicks. Focus here before creating more content.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/app/admin/guides/analytics" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:border-gray-300">
                        Guide analytics
                    </Link>
                    <Link href="/app/admin/outbound" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-gray-800">
                        Outbound stream
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
                <MetricCard label="High priority" value={highPriorityCount} helper="Fix these first" />
                <MetricCard label="Guide views" value={totalViews} helper="Last 30 days" />
                <MetricCard label="CTA clicks" value={totalCtaClicks} helper={`CTR ${totalViews ? pct(totalCtaClicks / totalViews) : "0.0%"}`} />
                <MetricCard label="Outbound clicks" value={totalOutbound} helper="Recent click stream" />
                <MetricCard label="Conversion fixes" value={conversionFixes} helper="Traffic-to-click issues" />
                <MetricCard label="Offer fixes" value={offerFixes} helper="Matching or payout gaps" />
                <MetricCard label="Missing links" value={missingAffiliateCount} helper="Affiliate URL gaps" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <section className="space-y-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="text-lg font-extrabold text-gray-900">Ranked monetization actions</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Each row points to the existing workflow that can fix the revenue leak.
                        </p>
                    </div>
                    {actions.length > 0 ? actions.map((action) => (
                        <ActionRow key={action.id} action={action} />
                    )) : (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                            <h2 className="text-lg font-extrabold text-gray-900">No monetization actions found</h2>
                            <p className="mt-2 text-sm text-gray-500">
                                More guide event and outbound click data will make this page more useful.
                            </p>
                        </div>
                    )}
                </section>

                <aside className="space-y-4">
                    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-extrabold text-gray-900">Top clicked targets</h2>
                        <div className="mt-3 divide-y divide-gray-100">
                            {topClicked.length > 0 ? topClicked.map(([target, clicks]) => (
                                <div key={target} className="py-3">
                                    <div className="truncate text-sm font-bold text-gray-900" title={target}>{target}</div>
                                    <div className="mt-1 text-xs text-gray-500">{clicks} recent click{clicks !== 1 ? "s" : ""}</div>
                                </div>
                            )) : (
                                <div className="py-8 text-center text-sm font-semibold text-gray-500">No outbound clicks yet.</div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-extrabold text-gray-900">Operating checklist</h2>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                            <li>Fix high-traffic guides with no CTA clicks.</li>
                            <li>Set manual primary offers when matching fails.</li>
                            <li>Refresh guide payout copy when offers move higher.</li>
                            <li>Push high-payout offers into relevant guides.</li>
                            <li>Review outbound records after each CTA change.</li>
                        </ul>
                    </section>
                </aside>
            </div>
        </div>
    );
}

/* eslint-disable @next/next/no-img-element -- EarnLab offer thumbnails come from arbitrary provider hosts. */
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
    getEarnLabGalleryTasksByCountry,
    type EarnLabGalleryTask,
} from "@/lib/earnlab-gallery";
import {
    EARNLAB_GALLERY_COUNTRIES,
    getEarnLabCountryName,
} from "@/lib/earnlab-countries";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { isPublicPayoutEligible, normalizeTotalPayout } from "@/lib/offer-quality";
import { formatDataRefreshedLabel } from "@/lib/payout-freshness";
import { normalizeProviderDisplayName } from "@/lib/provider-normalization";

const COUNTRY_LINKS = EARNLAB_GALLERY_COUNTRIES.slice(0, 8);
const MAX_DISPLAYED_OFFERS = 48;
const IMPORTED_QUERY_LIMIT = 220;

type CountryOfferSource = "database" | "live";
type CountryOfferSort = "reward-desc" | "reward-asc" | "newest" | "updated" | "title";

type CountryOffer = EarnLabGalleryTask & {
    source: CountryOfferSource;
    importedAt: string | null;
    updatedAt: string | null;
};

type ImportedSiteOfferRow = {
    id: string;
    external_id: string | null;
    title: string;
    payout_usd: number | string | null;
    total_payout_usd: number | string | null;
    goal_text: string | null;
    offer_url: string | null;
    image_url: string | null;
    devices: string[] | null;
    countries: string[] | null;
    ingested_at: string | null;
    updated_at: string | null;
    provider: { name: string | null } | { name: string | null }[] | null;
    game: {
        name: string | null;
        slug: string | null;
        thumbnail_url: string | null;
        category: string | null;
        description: string | null;
    } | {
        name: string | null;
        slug: string | null;
        thumbnail_url: string | null;
        category: string | null;
        description: string | null;
    }[] | null;
};

const SORT_OPTIONS: Array<{ value: CountryOfferSort; label: string }> = [
    { value: "reward-desc", label: "Highest reward" },
    { value: "reward-asc", label: "Lowest reward" },
    { value: "newest", label: "Newest imported" },
    { value: "updated", label: "Recently updated" },
    { value: "title", label: "A-Z" },
];

function formatMoney(value: number): string {
    return `$${value.toFixed(2)}`;
}

function formatUpdatedAt(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function toNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

function firstRelated<T>(value: T | T[] | null): T | null {
    return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeCountryOfferSort(value: string | null | undefined): CountryOfferSort {
    return SORT_OPTIONS.some((option) => option.value === value) ? value as CountryOfferSort : "reward-desc";
}

function sortOffers(offers: CountryOffer[], sort: CountryOfferSort): CountryOffer[] {
    const sorted = [...offers];
    sorted.sort((a, b) => {
        if (sort === "reward-asc") return a.payout - b.payout || a.title.localeCompare(b.title);
        if (sort === "newest") return dateValue(b.importedAt) - dateValue(a.importedAt) || b.payout - a.payout;
        if (sort === "updated") return dateValue(b.updatedAt) - dateValue(a.updatedAt) || b.payout - a.payout;
        if (sort === "title") return a.title.localeCompare(b.title) || b.payout - a.payout;
        return b.payout - a.payout || a.title.localeCompare(b.title);
    });
    return sorted;
}

function dateValue(value: string | null): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}

function dedupeImportedOffers(offers: CountryOffer[]): CountryOffer[] {
    const bySourceId = new Map<string, CountryOffer>();
    for (const offer of offers) {
        const key = [
            offer.rawSourceMetadata.sourceId.replace(new RegExp(`-${offer.countryCode}$`, "i"), ""),
            offer.providerName.toLowerCase(),
            offer.countryCode,
        ].join(":");
        const existing = bySourceId.get(key);
        if (!existing || dateValue(offer.importedAt) > dateValue(existing.importedAt)) {
            bySourceId.set(key, offer);
        }
    }
    return Array.from(bySourceId.values());
}

function mapDevicesToPlatforms(devices: string[] | null | undefined): CountryOffer["platform"] {
    const platforms: CountryOffer["platform"] = [];
    for (const device of devices ?? []) {
        const normalized = device.toLowerCase();
        if (normalized === "ios") platforms.push("iOS");
        if (normalized === "android") platforms.push("Android");
        if (normalized === "pc" || normalized === "desktop") platforms.push("Desktop");
        if (normalized === "web") platforms.push("Web");
    }
    return platforms.length > 0 ? Array.from(new Set(platforms)) as CountryOffer["platform"] : ["Web"];
}

function buildImportedOfferStartUrl(offer: ImportedSiteOfferRow, countryCode: string, payout: number, providerName: string): string {
    const params = new URLSearchParams({
        platform_name: "EarnLab",
        offer_title: offer.title,
        provider_name: providerName,
        payout_usd: String(payout),
        total_payout_usd: String(payout),
        click_location: `earnlab-country-${countryCode.toLowerCase()}`,
        source_context: "earnlab-imported-country-page",
    });

    return `/go/${offer.id}?${params.toString()}`;
}

function mapImportedOffer(row: ImportedSiteOfferRow, countryCode: string): CountryOffer {
    const provider = firstRelated(row.provider);
    const game = firstRelated(row.game);
    const basePayout = toNumber(row.payout_usd);
    const payout = normalizeTotalPayout(basePayout, toNumber(row.total_payout_usd, basePayout));
    const providerName = normalizeProviderDisplayName(provider?.name?.trim() || "EarnLab");
    const description = row.goal_text ?? game?.description ?? null;
    const sourceId = row.external_id?.replace(new RegExp(`-${countryCode}$`, "i"), "") || row.id;

    return {
        id: row.id,
        title: row.title,
        slug: game?.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        description,
        shortDescription: row.goal_text ?? description,
        countryCode,
        reward: Math.round(payout * 1000),
        payout,
        currency: "USD",
        imageUrl: row.image_url ?? game?.thumbnail_url ?? null,
        trackingUrl: null,
        startUrl: buildImportedOfferStartUrl(row, countryCode, payout, providerName),
        advertiserName: game?.name ?? row.title,
        providerName,
        platform: mapDevicesToPlatforms(row.devices),
        category: game?.category ?? "Other",
        difficulty: payout >= 150 ? "Medium" : payout >= 50 ? "Easy-Medium" : "Easy",
        estimatedTime: null,
        requirements: description ? [description] : [],
        tasks: description
            ? [{
                title: row.title,
                rewardAmount: payout,
                rewardDisplay: formatMoney(payout),
                taskType: "other",
                timeLimitText: null,
                notes: description,
                sortOrder: 1,
            }]
            : [],
        expiresAt: null,
        status: "active",
        rawSourceMetadata: {
            source: "earnlab",
            sourceId,
            provider: providerName,
            category: game?.category ?? null,
            customCategory: null,
            isDesktop: row.devices?.includes("pc") ?? false,
            isAndroid: row.devices?.includes("android") ?? false,
            isIOS: row.devices?.includes("ios") ?? false,
        },
        source: "database",
        importedAt: row.ingested_at,
        updatedAt: row.updated_at,
    };
}

async function getImportedEarnLabOffers(countryCode: string, sort: CountryOfferSort): Promise<CountryOffer[]> {
    const supabase = createClient();
    const { data: platform } = await supabase
        .from("platforms")
        .select("id")
        .eq("slug", "earnlab")
        .maybeSingle();

    if (!platform?.id) return [];

    let query = supabase
        .from("site_offers")
        .select(`
            id,
            external_id,
            title,
            payout_usd,
            total_payout_usd,
            goal_text,
            offer_url,
            image_url,
            devices,
            countries,
            ingested_at,
            updated_at,
            provider:providers(name),
            game:games(name, slug, thumbnail_url, category, description)
        `)
        .eq("site_id", platform.id)
        .eq("status", "active")
        .contains("countries", [countryCode]);

    if (sort === "reward-asc") {
        query = query
            .order("total_payout_usd", { ascending: true, nullsFirst: false })
            .order("payout_usd", { ascending: true });
    } else if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
    } else if (sort === "updated") {
        query = query.order("updated_at", { ascending: false });
    } else if (sort === "title") {
        query = query.order("title", { ascending: true });
    } else {
        query = query
            .order("total_payout_usd", { ascending: false, nullsFirst: false })
            .order("payout_usd", { ascending: false });
    }

    const { data, error } = await query.limit(IMPORTED_QUERY_LIMIT);

    if (error) {
        console.error("[EarnLabCountryOffersPage] database offers failed", {
            country: countryCode,
            message: error.message,
        });
        return [];
    }

    return sortOffers(
        dedupeImportedOffers(((data ?? []) as ImportedSiteOfferRow[])
            .map((row) => mapImportedOffer(row, countryCode))
            .filter((offer) => isPublicPayoutEligible(offer.payout, offer.payout))),
        sort,
    ).slice(0, MAX_DISPLAYED_OFFERS);
}

async function getCountryOffers(countryCode: string, sort: CountryOfferSort): Promise<{ offers: CountryOffer[]; source: CountryOfferSource }> {
    const importedOffers = await getImportedEarnLabOffers(countryCode, sort);
    if (importedOffers.length > 0) {
        return { offers: importedOffers, source: "database" };
    }

    const live = await getEarnLabGalleryTasksByCountry(countryCode, {
        limit: 24,
    });

    return {
        offers: sortOffers(live.offers.map((offer) => ({
            ...offer,
            source: "live" as const,
            importedAt: null,
            updatedAt: null,
        })), sort),
        source: "live",
    };
}

function OfferImage({ offer }: { offer: CountryOffer }) {
    if (!offer.imageUrl) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[var(--surface-muted)] text-sm font-black uppercase text-[var(--text-tertiary)]">
                {offer.title.slice(0, 2)}
            </div>
        );
    }

    return (
        <img
            src={offer.imageUrl}
            alt={offer.title}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
        />
    );
}

function getTrackedOfferHref(offer: CountryOffer): string {
    return offer.startUrl;
}

function OfferCard({ offer }: { offer: CountryOffer }) {
    const platformLabel = offer.platform.join(", ");
    const requirement = offer.shortDescription ?? offer.requirements[0] ?? "Open EarnLab to review the current task rules before starting.";

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-md">
            <div className="flex gap-4 p-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-[var(--border-default)]">
                    <OfferImage offer={offer} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[var(--brand-lime)]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[color:hsl(84,93%,25%)]">
                            {offer.countryCode}
                        </span>
                        <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                            {platformLabel}
                        </span>
                    </div>
                    <h2 className="mt-2 line-clamp-2 text-base font-extrabold leading-tight text-[var(--brand-ink)] group-hover:text-lime-700">
                        {offer.title}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">
                        {offer.providerName} / {offer.category}
                    </p>
                </div>
            </div>

            <div className="flex flex-1 flex-col px-4 pb-4">
                <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {requirement}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Reward</div>
                        <div className="text-lg font-black text-[color:hsl(84,93%,25%)]">{formatMoney(offer.payout)}</div>
                        <div className="mt-1 text-[11px] font-medium text-[var(--text-tertiary)]">
                            {formatDataRefreshedLabel(offer.updatedAt ?? offer.importedAt)}
                        </div>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Difficulty</div>
                        <div className="truncate text-sm font-extrabold text-[var(--brand-ink)]">{offer.difficulty ?? "Check terms"}</div>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <TrackedOutboundLink
                        href={getTrackedOfferHref(offer)}
                        eventLabel="earnlab-country-offer-cta"
                        offerId={offer.id}
                        offerTitle={offer.title}
                        gameTitle={offer.advertiserName ?? offer.title}
                        platformName="EarnLab"
                        providerName={offer.providerName}
                        payoutUsd={offer.payout}
                        location={`earnlab-country-${offer.countryCode.toLowerCase()}`}
                        sourceContext={offer.source === "database" ? "earnlab-imported-country-page" : "earnlab-gallery-country-page"}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--brand-ink)] px-4 py-2.5 text-sm font-extrabold text-[var(--brand-lime)] transition hover:bg-[var(--brand-ink)]/90"
                    >
                        View on EarnLab
                    </TrackedOutboundLink>
                    <Link
                        href={`/offers?country=${offer.countryCode}&q=${encodeURIComponent(offer.title)}`}
                        className="inline-flex items-center justify-center rounded-xl border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm font-bold text-[var(--brand-ink)] transition hover:border-lime-300 hover:bg-[var(--brand-lime)]/10"
                    >
                        Compare
                    </Link>
                </div>
            </div>
        </article>
    );
}

function sortHref(country: string, sort: CountryOfferSort): string {
    return sort === "reward-desc"
        ? `/offers/${country.toLowerCase()}`
        : `/offers/${country.toLowerCase()}?sort=${sort}`;
}

export async function EarnLabCountryOffersPage({
    countryCode,
    sort: sortParam,
}: {
    countryCode: string;
    sort?: string | null;
}) {
    const country = countryCode.toUpperCase();
    const sort = normalizeCountryOfferSort(sortParam);
    const countryName = getEarnLabCountryName(country);
    const result = await getCountryOffers(country, sort).catch((error) => {
        console.error("[EarnLabCountryOffersPage] failed", {
            country,
            message: error instanceof Error ? error.message : String(error),
        });
        return null;
    });
    const offers = result?.offers ?? [];
    const lastUpdatedAt = offers.reduce<string | null>((latest, offer) => {
        const value = offer.importedAt ?? offer.updatedAt;
        if (!value) return latest;
        if (!latest) return value;
        return new Date(value).getTime() > new Date(latest).getTime() ? value : latest;
    }, null);
    const lastUpdatedLabel = result?.source === "database"
        ? formatUpdatedAt(lastUpdatedAt)
        : null;
    const topPayout = offers.reduce((max, offer) => Math.max(max, offer.payout), 0);

    return (
        <main className="min-h-screen bg-[var(--surface-muted)] pb-24 pt-8 sm:pt-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <nav className="mb-5 flex items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
                    <Link href="/offers" className="hover:text-lime-700">Offers</Link>
                    <span>/</span>
                    <span className="text-[var(--text-secondary)]">{countryName}</span>
                </nav>

                <section className="rounded-3xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <p className="section-label mb-2">EarnLab country offers</p>
                            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-[var(--brand-ink)] sm:text-5xl">
                                Best EarnLab offers in {countryName}
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                                {result?.source === "database"
                                    ? `Browse imported EarnLab gallery tasks for ${countryName}.`
                                    : `Browse live EarnLab gallery tasks for ${countryName} while imported rows are unavailable.`} Compare rewards, platforms, and task requirements before opening EarnLab.
                            </p>
                            <p className="mt-3 text-xs font-semibold text-[var(--text-tertiary)]">
                                Offers last updated: {lastUpdatedLabel ?? (result?.source === "live" ? "live EarnLab fallback" : "not imported yet")}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                            <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Loaded</div>
                                <div className="mt-1 text-3xl font-black text-[var(--brand-ink)]">{offers.length}</div>
                            </div>
                            <div className="rounded-2xl bg-[var(--brand-lime)]/15 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[color:hsl(84,93%,25%)]">Top reward</div>
                                <div className="mt-1 text-3xl font-black text-[color:hsl(84,93%,25%)]">{formatMoney(topPayout)}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-5 flex flex-wrap gap-2">
                    {COUNTRY_LINKS.map((code) => (
                        <Link
                            key={code}
                            href={`/offers/${code.toLowerCase()}`}
                            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                                code === country
                                    ? "border-[var(--brand-lime)] bg-[var(--brand-lime)] text-[var(--brand-ink)]"
                                    : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-lime-300"
                            }`}
                        >
                            {code}
                        </Link>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-white p-3 shadow-[var(--shadow-card)]">
                    <span className="mr-1 text-xs font-extrabold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Sort
                    </span>
                    {SORT_OPTIONS.map((option) => (
                        <Link
                            key={option.value}
                            href={sortHref(country, option.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                                option.value === sort
                                    ? "border-[var(--brand-lime)] bg-[var(--brand-lime)] text-[var(--brand-ink)]"
                                    : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-lime-300 hover:bg-[var(--brand-lime)]/10"
                            }`}
                        >
                            {option.label}
                        </Link>
                    ))}
                </div>

                {offers.length > 0 ? (
                    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {offers.map((offer) => (
                            <OfferCard key={offer.id} offer={offer} />
                        ))}
                    </section>
                ) : (
                    <section className="mt-6 rounded-2xl border border-[var(--border-default)] bg-white p-12 text-center shadow-[var(--shadow-card)]">
                        <h2 className="text-xl font-extrabold text-[var(--brand-ink)]">No EarnLab offers loaded</h2>
                        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
                            No imported EarnLab offers are active for {countryName}, and the live fallback did not return gallery tasks. Try another country or refresh from the admin import panel.
                        </p>
                    </section>
                )}

                <section className="mt-8 grid gap-4 md:grid-cols-3">
                    {[
                        ["Do EarnLab offers vary by country?", `Yes. EarnLab's gallery request accepts a country code, so available tasks and rewards can differ for ${countryName}.`],
                        ["Are rewards guaranteed?", "No. Task rules, device eligibility, timers, and tracking windows can change. Always verify the live EarnLab task before spending time or money."],
                        ["Why do CTAs open EarnLab?", "EarnLab does not currently provide direct per-offer links in the gallery response. CTAs use the EarnLab platform affiliate route until direct links are available."],
                    ].map(([question, answer]) => (
                        <div key={question} className="rounded-2xl border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
                            <h2 className="text-base font-extrabold text-[var(--brand-ink)]">{question}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{answer}</p>
                        </div>
                    ))}
                </section>
            </div>
        </main>
    );
}

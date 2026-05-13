import Link from "next/link";
import type { ReactNode } from "react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import { getGainGalleryOffers, type GainGalleryWall } from "@/lib/gain-gallery";
import { isPublicPayoutEligible, normalizeTotalPayout } from "@/lib/offer-quality";
import { normalizeProviderDisplayName } from "@/lib/provider-normalization";
import { createClient } from "@/lib/supabase/server";

type GainOfferRow = {
    id: string;
    external_id: string | null;
    title: string | null;
    payout_usd: number | null;
    total_payout_usd: number | null;
    goal_text: string | null;
    image_url: string | null;
    offer_url: string | null;
    countries: string[] | null;
    devices: string[] | null;
    updated_at: string | null;
    provider: { name: string | null } | { name: string | null }[] | null;
    game: { name: string | null; slug: string | null; category: string | null } | { name: string | null; slug: string | null; category: string | null }[] | null;
    tasks: { id: string }[] | null;
    current_gain_offer_id?: string | null;
};

const WALL_LABELS: Record<string, string> = {
    native: "Native Gain / Torox",
    revu: "Revenue Universe",
    adtowall: "AdToWall",
    mychips: "MyChips",
    cpx: "CPX Research",
    asmwall: "ASMWall",
    lootably: "Lootably",
};

export default async function GainCountryOffersPage({
    countryCode,
    wall,
}: {
    countryCode: "US";
    wall?: GainGalleryWall;
}) {
    const offers = await getImportedGainOffers(countryCode, wall);
    const title = wall ? `${WALL_LABELS[wall] ?? wall} Gain.gg offers` : "Best Gain.gg offers in the United States";
    const intro = wall
        ? `Browse imported ${WALL_LABELS[wall] ?? wall} offers available through Gain.gg for ${countryCode}.`
        : "Browse imported Gain.gg offers across Torox, Revenue Universe, AdToWall, ASMWall, Lootably, and CPX Research.";

    return (
        <main className="min-h-screen bg-[#f7f8fb]">
            <section className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-sky-700">Gain.gg offers / {countryCode}</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">{title}</h1>
                        <p className="mt-4 text-base leading-7 text-gray-600">{intro} Payouts and tasks can change, so compare the live wall before starting.</p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <PillLink href="/offers/gain/us" active={!wall}>All Gain</PillLink>
                        {(["native", "revu", "adtowall", "asmwall", "lootably", "cpx"] as GainGalleryWall[]).map((item) => (
                            <PillLink key={item} href={`/offers/gain/us/${item}`} active={wall === item}>
                                {WALL_LABELS[item] ?? item}
                            </PillLink>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {offers.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {offers.map((offer) => (
                            <OfferCard key={offer.id} offer={offer} countryCode={countryCode} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                        <h2 className="text-xl font-black text-gray-950">No imported Gain offers found</h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
                            Run the Gain batch import from the admin site offers page, then refresh this page.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}

async function getImportedGainOffers(countryCode: string, wall?: GainGalleryWall): Promise<GainOfferRow[]> {
    const supabase = createClient();
    const { data: site } = await supabase
        .from("platforms")
        .select("id")
        .eq("slug", "gain-gg")
        .maybeSingle();

    if (!site?.id) return [];

    let query = supabase
        .from("site_offers")
        .select(`
            id, external_id, title, payout_usd, total_payout_usd, goal_text, image_url, offer_url, countries, devices, updated_at,
            provider:providers(name),
            game:games(name, slug, category),
            tasks:site_offer_tasks(id)
        `)
        .eq("site_id", site.id)
        .eq("status", "active")
        .contains("countries", [countryCode])
        .like("external_id", "gain-%")
        .order("total_payout_usd", { ascending: false })
        .limit(120);

    if (wall) {
        query = query.like("external_id", `gain-${wall}-%`);
    }

    const { data, error } = await query;
    if (error) {
        console.error("[GainCountryOffersPage] failed to load offers", { countryCode, wall, message: error.message });
        return [];
    }
    const currentNativeIds = wall === "native" ? await getCurrentNativeGainOfferIds(countryCode) : new Map<string, string>();

    return ((data ?? []) as GainOfferRow[]).map((offer) => ({
        ...offer,
        current_gain_offer_id: currentNativeIds.get(getNativeGainOfferFamily(offer.external_id)) ?? null,
    })).filter((offer) => {
        const payout = Number(offer.payout_usd ?? 0);
        const total = normalizeTotalPayout(payout, Number(offer.total_payout_usd ?? payout));
        return isPublicPayoutEligible(payout, total);
    });
}

function OfferCard({ offer, countryCode }: { offer: GainOfferRow; countryCode: string }) {
    const provider = firstRelated(offer.provider);
    const providerName = normalizeProviderDisplayName(provider?.name);
    const game = firstRelated(offer.game);
    const wall = extractGainWallFromExternalId(offer.external_id ?? "");
    const title = game?.name ?? offer.title ?? "Gain offer";
    const payout = normalizeTotalPayout(Number(offer.payout_usd ?? 0), Number(offer.total_payout_usd ?? offer.payout_usd ?? 0));
    const devices = Array.isArray(offer.devices) ? offer.devices : [];
    const taskCount = Array.isArray(offer.tasks) ? offer.tasks.length : 0;
    const href = buildGainOfferHref(offer);

    return (
        <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {offer.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={offer.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-gray-400">GAIN</div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge>{WALL_LABELS[wall] ?? (wall || "Gain")}</Badge>
                        <Badge>{countryCode}</Badge>
                        {devices.slice(0, 2).map((device) => <Badge key={device}>{device}</Badge>)}
                    </div>
                    <h2 className="mt-2 line-clamp-2 text-base font-black leading-snug text-gray-950">{title}</h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{offer.goal_text ?? game?.category ?? "Compare live terms before starting."}</p>
                </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total payout</div>
                        <div className="text-xl font-black text-gray-950">${payout.toFixed(2)}</div>
                    </div>
                    <div className="text-right text-xs font-semibold text-gray-500">
                        {providerName}
                        <div>{taskCount} task{taskCount === 1 ? "" : "s"}</div>
                    </div>
                </div>
                <TrackedOutboundLink
                    href={href}
                    eventLabel="gain-country-offer-cta"
                    offerId={offer.id}
                    offerTitle={title}
                    gameTitle={game?.name ?? title}
                    platformName="Gain.gg"
                    providerName={providerName}
                    payoutUsd={payout}
                    location={`gain-country-${countryCode.toLowerCase()}`}
                    sourceContext={wall ? `gain-${wall}-country-page` : "gain-country-page"}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-gray-800"
                >
                    View on Gain.gg
                </TrackedOutboundLink>
            </div>
        </article>
    );
}

function PillLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
    return (
        <Link href={href} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${active ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {children}
        </Link>
    );
}

function Badge({ children }: { children: ReactNode }) {
    return <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-700">{children}</span>;
}

function firstRelated<T>(value: T | T[] | null): T | null {
    return Array.isArray(value) ? value[0] ?? null : value;
}

function extractGainWallFromExternalId(externalId: string): string {
    const match = externalId.match(/^gain-([a-z]+)-/);
    return match?.[1] ?? "";
}

async function getCurrentNativeGainOfferIds(countryCode: string): Promise<Map<string, string>> {
    try {
        const result = await getGainGalleryOffers("native", {
            country: countryCode,
            limit: 300,
            refresh: true,
        });
        const byFamily = new Map<string, string>();
        for (const offer of result.offers) {
            const family = getGainOfferFamily(offer.id);
            if (family && !byFamily.has(family)) byFamily.set(family, offer.id);
        }
        return byFamily;
    } catch (error) {
        console.error("[GainCountryOffersPage] failed to load current Gain native IDs", {
            countryCode,
            message: error instanceof Error ? error.message : String(error),
        });
        return new Map();
    }
}

function buildGainOfferHref(offer: GainOfferRow): string {
    if (!offer.current_gain_offer_id) return `/go/${offer.id}`;
    const params = new URLSearchParams({
        gain_offer_id: offer.current_gain_offer_id,
    });
    return `/go/${offer.id}?${params.toString()}`;
}

function getNativeGainOfferFamily(externalId: string | null | undefined): string {
    const match = externalId?.match(/^gain-native-([A-Za-z0-9]+)-[A-Za-z0-9]+-[A-Z]{2}$/i);
    return match?.[1] ?? "";
}

function getGainOfferFamily(offerId: string | null | undefined): string {
    const match = offerId?.match(/^([A-Za-z0-9]+)-[A-Za-z0-9]+$/);
    return match?.[1] ?? "";
}

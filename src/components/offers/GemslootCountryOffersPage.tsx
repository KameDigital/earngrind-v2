import Link from "next/link";
import type { ReactNode } from "react";
import TrackedOutboundLink from "@/components/offers/TrackedOutboundLink";
import {
    GEMSLOOT_PUBLIC_PROVIDERS,
    type GemslootProviderSlug,
} from "@/lib/gemsloot-providers";
import type { GemslootPublicCountry } from "@/lib/gemsloot-countries";
import { isPublicPayoutEligible, normalizeTotalPayout } from "@/lib/offer-quality";
import { formatDataRefreshedLabel } from "@/lib/payout-freshness";
import { normalizeProviderDisplayName } from "@/lib/provider-normalization";
import { createClient } from "@/lib/supabase/server";

type GemslootOfferRow = {
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
};

export default async function GemslootCountryOffersPage({
    country,
    provider,
}: {
    country: GemslootPublicCountry;
    provider?: GemslootProviderSlug;
}) {
    const offers = await getImportedGemslootOffers(country.code, provider);
    const providerLabel = provider ? GEMSLOOT_PUBLIC_PROVIDERS.find((item) => item.slug === provider)?.label ?? provider : null;
    const title = providerLabel ? `${providerLabel} Gemsloot offers` : `Best Gemsloot offers in ${country.name}`;
    const intro = providerLabel
        ? `Browse imported ${providerLabel} offers available through Gemsloot for ${country.name}.`
        : "Browse imported Gemsloot offers across Gemsloot, ToroX, Revenue Universe, BitLabs, TyrAds, and other providers.";

    return (
        <main className="min-h-screen bg-[#f7f8fb]">
            <section className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Gemsloot offers / {country.shortName}</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">{title}</h1>
                        <p className="mt-4 text-base leading-7 text-gray-600">{intro} Payouts, availability, and tasks can change, so compare the live Gemsloot page before starting.</p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <PillLink href={`/offers/gemsloot/${country.slug}`} active={!provider}>All Gemsloot</PillLink>
                        {GEMSLOOT_PUBLIC_PROVIDERS.map((item) => (
                            <PillLink key={item.slug} href={`/offers/gemsloot/${country.slug}/${item.slug}`} active={provider === item.slug}>
                                {item.label}
                            </PillLink>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {offers.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {offers.map((offer) => (
                            <OfferCard key={offer.id} offer={offer} countryCode={country.code} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                        <h2 className="text-xl font-black text-gray-950">No imported Gemsloot offers found</h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
                            Run the Gemsloot import from the admin site offers page, then refresh this page.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}

async function getImportedGemslootOffers(countryCode: string, provider?: GemslootProviderSlug): Promise<GemslootOfferRow[]> {
    const supabase = createClient();
    const { data: site } = await supabase
        .from("platforms")
        .select("id")
        .eq("slug", "gemsloot")
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
        .like("external_id", "gemsloot-%")
        .order("total_payout_usd", { ascending: false })
        .limit(120);

    if (provider) {
        query = query.like("external_id", `gemsloot-${provider}-%`);
    }

    const { data, error } = await query;
    if (error) {
        console.error("[GemslootCountryOffersPage] failed to load offers", { countryCode, provider, message: error.message });
        return [];
    }
    return ((data ?? []) as GemslootOfferRow[]).filter((offer) => {
        const payout = Number(offer.payout_usd ?? 0);
        const total = normalizeTotalPayout(payout, Number(offer.total_payout_usd ?? payout));
        return isPublicPayoutEligible(payout, total);
    });
}

function OfferCard({ offer, countryCode }: { offer: GemslootOfferRow; countryCode: string }) {
    const provider = firstRelated(offer.provider);
    const providerName = normalizeProviderDisplayName(provider?.name);
    const game = firstRelated(offer.game);
    const title = game?.name ?? offer.title ?? "Gemsloot offer";
    const payout = normalizeTotalPayout(Number(offer.payout_usd ?? 0), Number(offer.total_payout_usd ?? offer.payout_usd ?? 0));
    const devices = Array.isArray(offer.devices) ? offer.devices : [];
    const taskCount = Array.isArray(offer.tasks) ? offer.tasks.length : 0;

    return (
        <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {offer.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={offer.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-gray-400">GEMS</div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge>{providerName}</Badge>
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
                        <div className="mt-1 text-[11px] font-semibold text-gray-400">
                            {formatDataRefreshedLabel(offer.updated_at)}
                        </div>
                    </div>
                    <div className="text-right text-xs font-semibold text-gray-500">
                        {providerName}
                        <div>{taskCount} task{taskCount === 1 ? "" : "s"}</div>
                    </div>
                </div>
                <TrackedOutboundLink
                    href={`/go/${offer.id}`}
                    eventLabel="gemsloot-country-offer-cta"
                    offerId={offer.id}
                    offerTitle={title}
                    gameTitle={game?.name ?? title}
                    platformName="Gemsloot"
                    providerName={providerName}
                    payoutUsd={payout}
                    location={`gemsloot-country-${countryCode.toLowerCase()}`}
                    sourceContext="gemsloot-country-page"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-gray-800"
                >
                    View on Gemsloot
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
    return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">{children}</span>;
}

function firstRelated<T>(value: T | T[] | null): T | null {
    return Array.isArray(value) ? value[0] ?? null : value;
}

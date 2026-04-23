import type { RedirectAttributionInput } from "@/lib/outbound-attribution";
import { normalizeRedirectAttribution } from "@/lib/outbound-attribution";
import { createClient } from "@/lib/supabase/server";

export type OutboundType = "offer" | "site_offer" | "platform";

export type CanonicalOutboundRecord = {
    outbound_type: OutboundType;
    offer_id?: string;
    platform_id?: string;
    offer_title?: string;
    game_title?: string;
    platform_name?: string;
    provider_name?: string;
    payout_usd?: number;
    click_location?: string;
    source_context?: string;
    affiliate_mode?: string;
    destination_url?: string;
    created_at?: string;
};

type NestedName = { name: string | null } | Array<{ name: string | null }> | null;
type NestedPlatform = { id: string; name: string | null } | Array<{ id: string; name: string | null }> | null;

type OfferClickQueryRow = {
    clicked_at: string;
    offer:
        | {
            id: string;
            title: string | null;
            payout_usd: number | null;
            game: NestedName;
            provider: NestedName;
            platform: NestedPlatform;
        }
        | Array<{
            id: string;
            title: string | null;
            payout_usd: number | null;
            game: NestedName;
            provider: NestedName;
            platform: NestedPlatform;
        }>
        | null;
};

type SiteOfferClickQueryRow = {
    clicked_at: string;
    site_offer:
        | {
            id: string;
            goal_text: string | null;
            payout_usd: number | null;
            total_payout_usd: number | null;
            game: NestedName;
            provider: NestedName;
            site: NestedPlatform;
        }
        | Array<{
            id: string;
            goal_text: string | null;
            payout_usd: number | null;
            total_payout_usd: number | null;
            game: NestedName;
            provider: NestedName;
            site: NestedPlatform;
        }>
        | null;
};

type PlatformClickQueryRow = {
    clicked_at: string;
    platform_id: string;
    platform_name: string | null;
    offer_title: string | null;
    game_title: string | null;
    provider_name: string | null;
    payout_usd: number | null;
    click_location: string | null;
    source_context: string | null;
    destination_url: string | null;
    affiliate_mode: string | null;
};

function normalizeString(value: string | null | undefined): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

function normalizeTimestamp(value: string | null | undefined): string | undefined {
    const normalized = normalizeString(value);
    return normalized ?? undefined;
}

function first<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
}

function nestedName(value: NestedName): string | undefined {
    return normalizeString(first(value)?.name ?? undefined);
}

function nestedPlatform(value: NestedPlatform): { id?: string; name?: string } {
    const platform = first(value);
    return {
        id: normalizeString(platform?.id ?? undefined),
        name: normalizeString(platform?.name ?? undefined),
    };
}

export function buildCanonicalOutboundRecord(input: {
    outbound_type: OutboundType;
    offer_id?: string | null;
    platform_id?: string | null;
    created_at?: string | null;
    attribution?: RedirectAttributionInput;
}): CanonicalOutboundRecord {
    const attribution = normalizeRedirectAttribution(input.attribution ?? {});

    return Object.fromEntries(
        Object.entries({
            outbound_type: input.outbound_type,
            offer_id: normalizeString(input.offer_id),
            platform_id: normalizeString(input.platform_id),
            offer_title: attribution.offer_title,
            game_title: attribution.game_title,
            platform_name: attribution.platform_name,
            provider_name: attribution.provider_name,
            payout_usd: attribution.payout_usd,
            click_location: attribution.click_location,
            source_context: attribution.source_context,
            affiliate_mode: attribution.affiliate_mode,
            destination_url: attribution.destination_url,
            created_at: normalizeTimestamp(input.created_at),
        }).filter(([, value]) => value !== undefined),
    ) as CanonicalOutboundRecord;
}

export async function getRecentOutboundRecords(options?: {
    limit?: number;
    supabase?: ReturnType<typeof createClient>;
}): Promise<CanonicalOutboundRecord[]> {
    const limit = options?.limit ?? 100;
    const supabase = options?.supabase ?? createClient();

    const [offerClicksResult, siteOfferClicksResult, platformClicksResult] = await Promise.all([
        supabase
            .from("offer_clicks")
            .select(`
                clicked_at,
                offer:offer_id (
                    id,
                    title,
                    payout_usd,
                    game:games ( name ),
                    provider:providers ( name ),
                    platform:platforms ( id, name )
                )
            `)
            .order("clicked_at", { ascending: false })
            .limit(limit),
        supabase
            .from("site_offer_clicks")
            .select(`
                clicked_at,
                site_offer:site_offer_id (
                    id,
                    goal_text,
                    payout_usd,
                    total_payout_usd,
                    game:games ( name ),
                    provider:providers ( name ),
                    site:platforms ( id, name )
                )
            `)
            .order("clicked_at", { ascending: false })
            .limit(limit),
        supabase
            .from("platform_clicks")
            .select(`
                clicked_at,
                platform_id,
                platform_name,
                offer_title,
                game_title,
                provider_name,
                payout_usd,
                click_location,
                source_context,
                destination_url,
                affiliate_mode
            `)
            .order("clicked_at", { ascending: false })
            .limit(limit),
    ]);

    if (offerClicksResult.error) {
        throw new Error(`Failed to load offer clicks: ${offerClicksResult.error.message}`);
    }

    if (siteOfferClicksResult.error) {
        throw new Error(`Failed to load site offer clicks: ${siteOfferClicksResult.error.message}`);
    }

    if (platformClicksResult.error) {
        throw new Error(`Failed to load platform clicks: ${platformClicksResult.error.message}`);
    }

    const offerRecords = ((offerClicksResult.data ?? []) as OfferClickQueryRow[])
        .map((row) => {
            const offer = first(row.offer);
            const platform = nestedPlatform(offer?.platform ?? null);

            return buildCanonicalOutboundRecord({
                outbound_type: "offer",
                offer_id: offer?.id,
                platform_id: platform.id,
                created_at: row.clicked_at,
                attribution: {
                    offer_title: offer?.title,
                    game_title: nestedName(offer?.game ?? null),
                    platform_name: platform.name,
                    provider_name: nestedName(offer?.provider ?? null),
                    payout_usd: offer?.payout_usd,
                },
            });
        });

    const siteOfferRecords = ((siteOfferClicksResult.data ?? []) as SiteOfferClickQueryRow[])
        .map((row) => {
            const siteOffer = first(row.site_offer);
            const platform = nestedPlatform(siteOffer?.site ?? null);

            return buildCanonicalOutboundRecord({
                outbound_type: "site_offer",
                offer_id: siteOffer?.id,
                platform_id: platform.id,
                created_at: row.clicked_at,
                attribution: {
                    offer_title: siteOffer?.goal_text,
                    game_title: nestedName(siteOffer?.game ?? null),
                    platform_name: platform.name,
                    provider_name: nestedName(siteOffer?.provider ?? null),
                    payout_usd: siteOffer?.total_payout_usd ?? siteOffer?.payout_usd,
                },
            });
        });

    const platformRecords = ((platformClicksResult.data ?? []) as PlatformClickQueryRow[])
        .map((row) => buildCanonicalOutboundRecord({
            outbound_type: "platform",
            platform_id: row.platform_id,
            created_at: row.clicked_at,
            attribution: {
                platform_name: row.platform_name,
                offer_title: row.offer_title,
                game_title: row.game_title,
                provider_name: row.provider_name,
                payout_usd: row.payout_usd,
                click_location: row.click_location,
                source_context: row.source_context,
                destination_url: row.destination_url,
                affiliate_mode: row.affiliate_mode,
            },
        }));

    return [...offerRecords, ...siteOfferRecords, ...platformRecords]
        .sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""))
        .slice(0, limit);
}

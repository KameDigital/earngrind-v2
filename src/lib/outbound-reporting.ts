import type { RedirectAttributionInput } from "@/lib/outbound-attribution";
import { normalizeRedirectAttribution } from "@/lib/outbound-attribution";
import { createClient } from "@/lib/supabase/server";

export type OutboundType = "offer" | "site_offer" | "platform";

export type CanonicalOutboundRecord = {
    outbound_type: OutboundType;
    source_table?: "offer_clicks" | "site_offer_clicks" | "platform_clicks";
    offer_id?: string;
    platform_id?: string;
    offer_title?: string;
    game_title?: string;
    platform_name?: string;
    provider_name?: string;
    payout_usd?: number;
    total_payout_usd?: number;
    click_location?: string;
    source_context?: string;
    affiliate_mode?: string;
    destination_url?: string;
    created_at?: string;
};

type OfferClickQueryRow = {
    clicked_at: string;
    offer_id: string;
    platform_id: string | null;
    offer_title: string | null;
    game_title: string | null;
    platform_name: string | null;
    provider_name: string | null;
    payout_usd: number | null;
    total_payout_usd: number | null;
    click_location: string | null;
    source_context: string | null;
    destination_url: string | null;
    affiliate_mode: string | null;
};

type SiteOfferClickQueryRow = {
    clicked_at: string;
    site_offer_id: string;
    platform_id: string | null;
    offer_title: string | null;
    game_title: string | null;
    platform_name: string | null;
    provider_name: string | null;
    payout_usd: number | null;
    total_payout_usd: number | null;
    click_location: string | null;
    source_context: string | null;
    destination_url: string | null;
    affiliate_mode: string | null;
};

type PlatformClickQueryRow = {
    clicked_at: string;
    platform_id: string;
    platform_name: string | null;
    offer_title: string | null;
    game_title: string | null;
    provider_name: string | null;
    payout_usd: number | null;
    total_payout_usd: number | null;
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

export function buildCanonicalOutboundRecord(input: {
    outbound_type: OutboundType;
    source_table?: CanonicalOutboundRecord["source_table"];
    offer_id?: string | null;
    platform_id?: string | null;
    created_at?: string | null;
    attribution?: RedirectAttributionInput;
}): CanonicalOutboundRecord {
    const attribution = normalizeRedirectAttribution(input.attribution ?? {});

    return Object.fromEntries(
        Object.entries({
            outbound_type: input.outbound_type,
            source_table: input.source_table,
            offer_id: normalizeString(input.offer_id),
            platform_id: normalizeString(input.platform_id),
            offer_title: attribution.offer_title,
            game_title: attribution.game_title,
            platform_name: attribution.platform_name,
            provider_name: attribution.provider_name,
            payout_usd: attribution.payout_usd,
            total_payout_usd: attribution.total_payout_usd,
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
                offer_id,
                platform_id,
                offer_title,
                game_title,
                platform_name,
                provider_name,
                payout_usd,
                total_payout_usd,
                click_location,
                source_context,
                destination_url,
                affiliate_mode
            `)
            .order("clicked_at", { ascending: false })
            .limit(limit),
        supabase
            .from("site_offer_clicks")
            .select(`
                clicked_at,
                site_offer_id,
                platform_id,
                offer_title,
                game_title,
                platform_name,
                provider_name,
                payout_usd,
                total_payout_usd,
                click_location,
                source_context,
                destination_url,
                affiliate_mode
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
                total_payout_usd,
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
        .map((row) => buildCanonicalOutboundRecord({
            outbound_type: "offer",
            source_table: "offer_clicks",
            offer_id: row.offer_id,
            platform_id: row.platform_id,
            created_at: row.clicked_at,
            attribution: {
                offer_title: row.offer_title,
                game_title: row.game_title,
                platform_name: row.platform_name,
                provider_name: row.provider_name,
                payout_usd: row.payout_usd,
                total_payout_usd: row.total_payout_usd,
                click_location: row.click_location,
                source_context: row.source_context,
                destination_url: row.destination_url,
                affiliate_mode: row.affiliate_mode,
            },
        }));

    const siteOfferRecords = ((siteOfferClicksResult.data ?? []) as SiteOfferClickQueryRow[])
        .map((row) => buildCanonicalOutboundRecord({
            outbound_type: "site_offer",
            source_table: "site_offer_clicks",
            offer_id: row.site_offer_id,
            platform_id: row.platform_id,
            created_at: row.clicked_at,
            attribution: {
                offer_title: row.offer_title,
                game_title: row.game_title,
                platform_name: row.platform_name,
                provider_name: row.provider_name,
                payout_usd: row.payout_usd,
                total_payout_usd: row.total_payout_usd,
                click_location: row.click_location,
                source_context: row.source_context,
                destination_url: row.destination_url,
                affiliate_mode: row.affiliate_mode,
            },
        }));

    const platformRecords = ((platformClicksResult.data ?? []) as PlatformClickQueryRow[])
        .map((row) => buildCanonicalOutboundRecord({
            outbound_type: "platform",
            source_table: "platform_clicks",
            platform_id: row.platform_id,
            created_at: row.clicked_at,
            attribution: {
                platform_name: row.platform_name,
                offer_title: row.offer_title,
                game_title: row.game_title,
                provider_name: row.provider_name,
                payout_usd: row.payout_usd,
                total_payout_usd: row.total_payout_usd,
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

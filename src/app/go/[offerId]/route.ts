import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
    normalizeRedirectAttribution,
    readRedirectAttributionFromSearchParams,
    type RedirectAttribution,
} from "@/lib/outbound-attribution";
import { createClient } from "@/lib/supabase/server";
import {
    buildCashInStyleOutboundUrl,
    buildOutboundRedirectUrl,
    getPlatformAffiliateOverride,
    getPlatformFallbackUrl,
} from "@/lib/outbound";
import { buildGainOfferDeepLinkFromSiteOffer } from "@/lib/gain-deeplinks";
import { buildCanonicalOutboundRecord } from "@/lib/outbound-reporting";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getIpHash(req: NextRequest): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "";
    if (!ip) return null;
    return createHash("sha256").update(ip).digest("hex");
}

function getClientHints(req: NextRequest): Record<string, string> {
    return Object.fromEntries(
        [
            "sec-ch-ua",
            "sec-ch-ua-mobile",
            "sec-ch-ua-platform",
            "sec-ch-ua-platform-version",
            "sec-ch-ua-model",
        ]
            .map((header) => [header, req.headers.get(header)] as const)
            .filter(([, value]) => Boolean(value)),
    ) as Record<string, string>;
}

function toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function buildRequestAttribution(req: NextRequest): Partial<RedirectAttribution> {
    return readRedirectAttributionFromSearchParams(req.nextUrl.searchParams);
}

const GENERIC_PLATFORM_DESTINATIONS: Record<string, { hostnames: string[]; paths: string[] }> = {
    earnlab: {
        hostnames: ["earnlab.com"],
        paths: ["", "/earn", "/tasks"],
    },
    gain: {
        hostnames: ["gain.gg"],
        paths: ["", "/earn"],
    },
    gaingg: {
        hostnames: ["gain.gg"],
        paths: ["", "/earn"],
    },
    gemsloot: {
        hostnames: ["gemsloot.com"],
        paths: ["", "/earn", "/earn/all"],
    },
};

function getPlatformDestinationKeys(platform: { slug?: string | null; name?: string | null } | null | undefined): string[] {
    return [platform?.slug, platform?.name]
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => {
            const normalized = value.replace(/[^a-z0-9]+/g, "");
            return normalized && normalized !== value ? [value, normalized] : [value];
        });
}

function isGenericPlatformDestination(platform: { slug?: string | null; name?: string | null } | null | undefined, value: string | null | undefined): boolean {
    if (!value) return false;

    try {
        const url = new URL(value);
        const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
        const pathname = url.pathname.replace(/\/+$/g, "").toLowerCase();

        return getPlatformDestinationKeys(platform).some((key) => {
            const generic = GENERIC_PLATFORM_DESTINATIONS[key];
            return Boolean(generic?.hostnames.includes(hostname) && generic.paths.includes(pathname));
        });
    } catch {
        return false;
    }
}

function logRedirectAttribution(params: {
    entityType: "offer" | "site_offer";
    offerId: string;
    platformId?: string | null;
    req: NextRequest;
    attribution: Partial<RedirectAttribution>;
}) {
    const { entityType, offerId, platformId, req, attribution } = params;
    const record = buildCanonicalOutboundRecord({
        outbound_type: entityType,
        offer_id: offerId,
        platform_id: platformId,
        attribution,
    });

    console.info("[go] outbound redirect", {
        ...record,
        entity_type: entityType,
        referrer: req.headers.get("referer"),
        country: req.headers.get("x-vercel-ip-country"),
        user_agent: req.headers.get("user-agent"),
    });
}

async function logOfferClick(params: {
    supabase: ReturnType<typeof createClient>;
    table: "offer_clicks" | "site_offer_clicks";
    column: "offer_id" | "site_offer_id";
    offerId: string;
    platformId: string | null;
    req: NextRequest;
    userId: string | null;
    attribution: Partial<RedirectAttribution>;
}) {
    const { supabase, table, column, offerId, platformId, req, userId, attribution } = params;
    const normalized = normalizeRedirectAttribution(attribution);

    const payload = {
        [column]: offerId,
        platform_id: platformId,
        offer_title: normalized.offer_title ?? null,
        game_title: normalized.game_title ?? null,
        platform_name: normalized.platform_name ?? null,
        provider_name: normalized.provider_name ?? null,
        payout_usd: normalized.payout_usd ?? null,
        total_payout_usd: normalized.total_payout_usd ?? normalized.payout_usd ?? null,
        click_location: normalized.click_location ?? null,
        source_context: normalized.source_context ?? null,
        destination_url: normalized.destination_url ?? null,
        affiliate_mode: normalized.affiliate_mode ?? null,
        ip_hash: getIpHash(req),
        referrer: req.headers.get("referer"),
        country: req.headers.get("x-vercel-ip-country"),
        user_agent: req.headers.get("user-agent"),
        client_hints: getClientHints(req),
        user_id: userId,
    };

    const { error } = await supabase.from(table).insert(payload);
    if (error) {
        console.error(`[go] failed to log ${table} click`, { offerId, message: error.message });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { offerId: string } },
) {
    const supabase = createClient();
    const offerId = params.offerId;
    const requestAttribution = buildRequestAttribution(req);

    if (!isUuid(offerId)) {
        return NextResponse.json({ error: "invalid_offer_id" }, { status: 400 });
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select(`
            id,
            title,
            external_id,
            custom_param,
            payout_usd,
            status,
            game:games(
                name
            ),
            platform:platforms(
                id,
                name,
                slug,
                affiliate_template
            )
        `)
        .eq("id", offerId)
        .maybeSingle();

    if (offerError) {
        console.error("[go] failed to load offer", offerError);
        return NextResponse.json({ error: "internal" }, { status: 500 });
    }

    if (offer) {
        const platform = Array.isArray(offer.platform) ? offer.platform[0] ?? null : offer.platform;
        const game = Array.isArray(offer.game) ? offer.game[0] ?? null : offer.game;
        const cashInStyleOutboundUrl = buildCashInStyleOutboundUrl({
            platform,
            externalId: offer.external_id,
            customParam: offer.custom_param,
        });
        const platformOverrideUrl = getPlatformAffiliateOverride(platform);
        const outboundUrl = cashInStyleOutboundUrl ?? platformOverrideUrl ?? buildOutboundRedirectUrl({
            affiliateTemplate: platform?.affiliate_template,
            destinationUrl: offer.custom_param,
            fallbackUrl: getPlatformFallbackUrl(platform),
        });

        if (!outboundUrl) {
            return NextResponse.json({ error: "missing_destination" }, { status: 404 });
        }

        const attribution = normalizeRedirectAttribution({
            offer_title: requestAttribution.offer_title ?? offer.title ?? undefined,
            game_title: requestAttribution.game_title ?? game?.name ?? undefined,
            platform_name: requestAttribution.platform_name ?? platform?.name ?? undefined,
            provider_name: requestAttribution.provider_name,
            payout_usd: requestAttribution.payout_usd ?? toOptionalNumber(offer.payout_usd),
            total_payout_usd: requestAttribution.total_payout_usd ?? toOptionalNumber(offer.payout_usd),
            click_location: requestAttribution.click_location,
            source_context: requestAttribution.source_context,
            destination_url: outboundUrl,
            affiliate_mode: cashInStyleOutboundUrl
                ? "cashinstyle-deeplink"
                : platformOverrideUrl
                ? "platform-override"
                : platform?.affiliate_template?.includes("{destination}")
                    ? "destination-placeholder"
                    : platform?.affiliate_template
                        ? "base-template"
                        : "direct",
        });

        await logOfferClick({
            supabase,
            table: "offer_clicks",
            column: "offer_id",
            offerId: offer.id,
            platformId: platform?.id ?? null,
            req,
            userId: user?.id ?? null,
            attribution,
        });

        logRedirectAttribution({
            entityType: "offer",
            offerId: offer.id,
            platformId: platform?.id,
            req,
            attribution,
        });

        return NextResponse.redirect(outboundUrl, { status: 302 });
    }

    const { data: siteOffer, error: siteOfferError } = await supabase
        .from("site_offers")
        .select(`
            id,
            external_id,
            offer_url,
            payout_usd,
            total_payout_usd,
            goal_text,
            status,
            game:games(
                name
            ),
            provider:providers(
                name
            ),
            site:platforms(
                id,
                name,
                slug,
                affiliate_template
            )
        `)
        .eq("id", offerId)
        .maybeSingle();

    if (siteOfferError) {
        console.error("[go] failed to load site_offer", siteOfferError);
        return NextResponse.json({ error: "internal" }, { status: 500 });
    }

    if (!siteOffer) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const site = Array.isArray(siteOffer.site) ? siteOffer.site[0] ?? null : siteOffer.site;
    const game = Array.isArray(siteOffer.game) ? siteOffer.game[0] ?? null : siteOffer.game;
    const provider = Array.isArray(siteOffer.provider) ? siteOffer.provider[0] ?? null : siteOffer.provider;
    const cashInStyleOutboundUrl = buildCashInStyleOutboundUrl({
        platform: site,
        provider,
        externalId: siteOffer.external_id,
        offerUrl: siteOffer.offer_url,
    });
    const gainNativeDeepLink = buildGainOfferDeepLinkFromSiteOffer({
        externalId: siteOffer.external_id,
        site,
        provider,
    });
    const directSiteOfferUrl = buildOutboundRedirectUrl({
        affiliateTemplate: null,
        destinationUrl: siteOffer.offer_url,
        fallbackUrl: null,
    });
    const platformOverrideUrl = getPlatformAffiliateOverride(site);
    const effectiveDirectSiteOfferUrl = platformOverrideUrl && isGenericPlatformDestination(site, directSiteOfferUrl)
        ? null
        : directSiteOfferUrl;
    // EarnLab gallery rows intentionally have no direct per-offer URL today.
    // When offer_url is missing, keep CTAs working through the platform affiliate fallback.
    const outboundUrl = cashInStyleOutboundUrl ?? effectiveDirectSiteOfferUrl ?? gainNativeDeepLink ?? platformOverrideUrl ?? buildOutboundRedirectUrl({
        affiliateTemplate: site?.affiliate_template,
        destinationUrl: siteOffer.offer_url,
        fallbackUrl: getPlatformFallbackUrl(site),
    });

    if (!outboundUrl) {
        console.error("[go] missing outbound destination", {
            siteOfferId: siteOffer.id,
            siteSlug: site?.slug ?? null,
        });
        return NextResponse.json({ error: "missing_destination" }, { status: 404 });
    }

    const attribution = normalizeRedirectAttribution({
        offer_title: requestAttribution.offer_title ?? siteOffer.goal_text ?? undefined,
        game_title: requestAttribution.game_title ?? game?.name ?? undefined,
        platform_name: requestAttribution.platform_name ?? site?.name ?? undefined,
        provider_name: requestAttribution.provider_name ?? provider?.name ?? undefined,
        payout_usd: requestAttribution.payout_usd ?? toOptionalNumber(siteOffer.payout_usd),
        total_payout_usd: requestAttribution.total_payout_usd ??
            toOptionalNumber(siteOffer.total_payout_usd) ??
            toOptionalNumber(siteOffer.payout_usd),
        click_location: requestAttribution.click_location,
        source_context: requestAttribution.source_context,
        destination_url: outboundUrl,
        affiliate_mode: cashInStyleOutboundUrl
            ? "cashinstyle-deeplink"
            : effectiveDirectSiteOfferUrl
            ? "direct"
            : gainNativeDeepLink
            ? "gain-deeplink"
            : platformOverrideUrl
            ? "platform-override"
            : site?.affiliate_template?.includes("{destination}")
                ? "destination-placeholder"
                : site?.affiliate_template
                    ? "base-template"
                    : "direct",
    });

    await logOfferClick({
        supabase,
        table: "site_offer_clicks",
        column: "site_offer_id",
        offerId: siteOffer.id,
        platformId: site?.id ?? null,
        req,
        userId: user?.id ?? null,
        attribution,
    });

    logRedirectAttribution({
        entityType: "site_offer",
        offerId: siteOffer.id,
        platformId: site?.id,
        req,
        attribution,
    });

    return NextResponse.redirect(outboundUrl, { status: 302 });
}

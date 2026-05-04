import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
    normalizeRedirectAttribution,
    readRedirectAttributionFromSearchParams,
    type RedirectAttribution,
} from "@/lib/outbound-attribution";
import {
    buildPlatformAffiliateUrl,
    getPlatformAffiliateOverride,
} from "@/lib/outbound";
import { buildCanonicalOutboundRecord } from "@/lib/outbound-reporting";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildRequestAttribution(req: NextRequest): Partial<RedirectAttribution> {
    return readRedirectAttributionFromSearchParams(req.nextUrl.searchParams);
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

async function logPlatformClick(params: {
    supabase: ReturnType<typeof createClient>;
    platformId: string;
    req: NextRequest;
    userId: string | null;
    attribution: Partial<RedirectAttribution>;
}) {
    const { supabase, platformId, req, userId, attribution } = params;
    const normalized = normalizeRedirectAttribution(attribution);

    const payload = {
        platform_id: platformId,
        platform_name: normalized.platform_name ?? null,
        offer_title: normalized.offer_title ?? null,
        game_title: normalized.game_title ?? null,
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

    const { error } = await supabase.from("platform_clicks").insert(payload);
    if (error) {
        console.error("[go/platform] failed to log platform click", {
            platformId,
            message: error.message,
        });
    }
}

function logPlatformRedirect(params: {
    platformId: string;
    req: NextRequest;
    attribution: Partial<RedirectAttribution>;
}) {
    const { platformId, req, attribution } = params;
    const record = buildCanonicalOutboundRecord({
        outbound_type: "platform",
        platform_id: platformId,
        attribution,
    });

    console.info("[go/platform] outbound redirect", {
        ...record,
        entity_type: "platform",
        referrer: req.headers.get("referer"),
        country: req.headers.get("x-vercel-ip-country"),
        user_agent: req.headers.get("user-agent"),
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: { platformId: string } },
) {
    const platformId = params.platformId;
    if (!isUuid(platformId) && !/^[a-z0-9-]{2,80}$/i.test(platformId)) {
        return NextResponse.json({ error: "invalid_platform_id" }, { status: 400 });
    }

    const supabase = createClient();
    const requestAttribution = buildRequestAttribution(req);
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: platform, error } = await supabase
        .from("platforms")
        .select("id, name, slug, affiliate_template")
        .eq(isUuid(platformId) ? "id" : "slug", platformId)
        .maybeSingle();

    if (error) {
        console.error("[go/platform] failed to load platform", error);
        return NextResponse.json({ error: "internal" }, { status: 500 });
    }

    if (!platform) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const outboundUrl = buildPlatformAffiliateUrl({ platform });
    if (!outboundUrl) {
        return NextResponse.json({ error: "missing_destination" }, { status: 404 });
    }

    const attribution = normalizeRedirectAttribution({
        platform_name: requestAttribution.platform_name ?? platform.name ?? undefined,
        offer_title: requestAttribution.offer_title,
        game_title: requestAttribution.game_title,
        provider_name: requestAttribution.provider_name,
        payout_usd: requestAttribution.payout_usd,
        total_payout_usd: requestAttribution.total_payout_usd,
        click_location: requestAttribution.click_location,
        source_context: requestAttribution.source_context,
        destination_url: outboundUrl,
        affiliate_mode: getPlatformAffiliateOverride(platform)
            ? "platform-override"
            : platform.affiliate_template?.includes("{custom_param}")
                ? "custom-param-template"
                : platform.affiliate_template?.includes("{destination}")
                    ? "destination-placeholder"
                    : platform.affiliate_template
                        ? "base-template"
                        : "direct",
    });

    await logPlatformClick({
        supabase,
        platformId: platform.id,
        req,
        userId: user?.id ?? null,
        attribution,
    });

    logPlatformRedirect({
        platformId: platform.id,
        req,
        attribution,
    });

    return NextResponse.redirect(outboundUrl, { status: 302 });
}

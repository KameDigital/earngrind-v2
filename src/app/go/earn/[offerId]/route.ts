import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { recordRevenueEvent } from "@/lib/revenue-events-server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EarnOfferRow = {
    id: string;
    partner_id: string;
    title: string;
    offer_url_template: string;
    payout_cents: number;
    user_reward_cents: number;
    currency: string;
    incentive_allowed: boolean;
    reward_allowed: boolean;
    status: string;
    partner: { id: string; status: string } | { id: string; status: string }[] | null;
};

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

function getPartner(offer: EarnOfferRow): { id: string; status: string } | null {
    if (Array.isArray(offer.partner)) return offer.partner[0] ?? null;
    return offer.partner ?? null;
}

function buildTrackedUrl(template: string, clickId: string, userId: string | null): string | null {
    const replaced = template
        .replaceAll("{click_id}", encodeURIComponent(clickId))
        .replaceAll("{user_id}", userId ? encodeURIComponent(userId) : "");

    try {
        const url = new URL(replaced);
        url.searchParams.set("click_id", clickId);
        if (userId) url.searchParams.set("user_id", userId);
        return url.toString();
    } catch {
        return null;
    }
}

async function getOfferId(req: NextRequest, params: Promise<{ offerId: string }> | { offerId: string }): Promise<string> {
    const resolvedParams = await params;
    if (isUuid(resolvedParams.offerId)) return resolvedParams.offerId;

    const urlMatch = req.url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    if (urlMatch) return urlMatch[0];

    return req.nextUrl.pathname.split("/").filter(Boolean).at(-1) ?? "";
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ offerId: string }> | { offerId: string } },
) {
    const offerId = await getOfferId(req, params);
    if (!isUuid(offerId)) {
        return NextResponse.json({ error: "invalid_offer_id" }, { status: 400 });
    }

    const publicEntryEnabled = process.env.NEXT_PUBLIC_EARN_REWARDS_ENTRY_ENABLED === "true";
    const adminAuth = publicEntryEnabled ? null : await requireAdminOrEditor();
    if (adminAuth && !adminAuth.ok) {
        return NextResponse.redirect(new URL("/offers", req.nextUrl.origin), { status: 302 });
    }

    const supabase = adminAuth?.ok ? adminAuth.supabase : createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: offer, error: offerError } = await supabase
        .from("earn_offers")
        .select(`
            id,
            partner_id,
            title,
            offer_url_template,
            payout_cents,
            user_reward_cents,
            currency,
            incentive_allowed,
            reward_allowed,
            status,
            partner:offer_partners(
                id,
                status
            )
        `)
        .eq("id", offerId)
        .eq("status", "active")
        .maybeSingle<EarnOfferRow>();

    if (offerError) {
        console.error("[go/earn] failed to load offer", offerError);
        return NextResponse.json({ error: "internal" }, { status: 500 });
    }

    const partner = offer ? getPartner(offer) : null;
    if (!offer || partner?.status !== "active") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const isRewardable = offer.reward_allowed && Number(offer.user_reward_cents) > 0;
    if (isRewardable && !user) {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(loginUrl, { status: 302 });
    }

    const clickId = crypto.randomUUID();
    const userId = user?.id ?? null;
    const outboundUrl = buildTrackedUrl(offer.offer_url_template, clickId, userId);
    if (!outboundUrl) {
        return NextResponse.json({ error: "missing_destination" }, { status: 404 });
    }

    const { data: clickRow, error: clickError } = await supabase.from("offer_clicks").insert({
        click_id: clickId,
        earn_offer_id: offer.id,
        offer_partner_id: offer.partner_id,
        offer_title: offer.title,
        platform_name: "EarnGrind",
        provider_name: "EarnGrind",
        destination_url: outboundUrl,
        affiliate_mode: "earn-offer",
        gross_payout_cents: Number(offer.payout_cents ?? 0),
        user_reward_cents: Number(offer.user_reward_cents ?? 0),
        currency: offer.currency,
        incentive_allowed: offer.incentive_allowed,
        reward_allowed: offer.reward_allowed,
        user_id: userId,
        ip_hash: getIpHash(req),
        referrer: req.headers.get("referer"),
        country: req.headers.get("x-vercel-ip-country"),
        user_agent: req.headers.get("user-agent"),
        client_hints: getClientHints(req),
    }).select("id").maybeSingle<{ id: string }>();

    if (clickError) {
        console.error("[go/earn] failed to create offer_click", {
            offerId: offer.id,
            message: clickError.message,
        });
        return NextResponse.json({ error: "click_not_recorded" }, { status: 500 });
    }

    await recordRevenueEvent(supabase, {
        event_name: "outbound_click",
        route_path: req.nextUrl.pathname,
        route_group: "earn_go",
        entity_type: "offer",
        entity_id: offer.id,
        offer_id: offer.id,
        provider_name: "EarnGrind",
        cta_location: req.nextUrl.searchParams.get("click_location") ?? null,
        source_context: req.nextUrl.searchParams.get("source_context") ?? "earn_offer",
        target_url: outboundUrl,
        referrer_path: req.headers.get("referer"),
        outbound_click_table: "offer_clicks",
        outbound_click_id: clickRow?.id ?? null,
        user_id: userId,
        metadata: {
            click_id: clickId,
            offer_title: offer.title,
            affiliate_mode: "earn-offer",
            reward_allowed: offer.reward_allowed,
        },
    });

    return NextResponse.redirect(outboundUrl, { status: 302 });
}

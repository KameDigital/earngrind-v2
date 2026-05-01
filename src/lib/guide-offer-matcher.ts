export type GuideOfferMatch = {
    id: string;
    title: string;
    matchReason: string;
    score: number;
    payout: number | null;
    platform: string | null;
    provider: string | null;
    targetUrl: string;
    platformId: string | null;
    source: string | null;
    devices: string[];
    countries: string[];
    updatedAt: string | null;
    ctaLabel: string;
};

type GuideLike = {
    id?: string | null;
    title?: string | null;
    keyword_target?: string | null;
    game_id?: string | null;
    game?: { id?: string | null; name?: string | null; slug?: string | null } | null;
    platform_id?: string | null;
    platform_filter?: string | null;
    platform_name?: string | null;
    guide_type?: string | null;
    primary_offer_id?: string | null;
    disable_auto_offer_matching?: boolean | null;
};

type OfferLike = Record<string, unknown>;

function asString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function asStringArray(value: unknown) {
    return Array.isArray(value) ? value.map(asString).filter((item): item is string => Boolean(item)) : [];
}

function normalize(value: unknown) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function includesNormalized(haystack: unknown, needle: unknown) {
    const normalizedNeedle = normalize(needle);
    if (!normalizedNeedle) return false;
    return normalize(haystack).includes(normalizedNeedle);
}

function isOfferLive(offer: OfferLike) {
    const status = normalize(offer.status);
    if (status && !["active", "live", "published"].includes(status)) return false;

    const expiresAt = asString(offer.offer_expires_at);
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return false;

    const broken = Boolean(offer.is_broken ?? offer.broken ?? offer.expired);
    return !broken;
}

function buildTrackedUrl(offer: OfferLike, placement = "dynamic") {
    const id = asString(offer.id);
    if (!id) return "/offers";
    const params = new URLSearchParams();
    params.set("click_location", `guide_offer_cta_${placement}`);
    params.set("source_context", "guide_offer_matcher");
    const title = asString(offer.title) ?? asString(offer.goal_text) ?? asString(offer.game_name);
    const game = asString(offer.game_name);
    const platform = asString(offer.platform_name);
    const provider = asString(offer.provider_name);
    const payout = asNumber(offer.total_payout_usd ?? offer.payout_usd);
    if (title) params.set("offer_title", title);
    if (game) params.set("game_title", game);
    if (platform) params.set("platform_name", platform);
    if (provider) params.set("provider_name", provider);
    if (payout !== null) params.set("payout_usd", String(payout));
    if (payout !== null) params.set("total_payout_usd", String(payout));
    return `/go/${id}?${params.toString()}`;
}

function performanceClicks(offer: OfferLike, guideEventStats?: any) {
    const id = asString(offer.id);
    if (!id || !guideEventStats) return 0;
    const topLinks = Array.isArray(guideEventStats.topLinks) ? guideEventStats.topLinks : [];
    return topLinks.reduce((sum: number, link: { targetUrl?: string; clicks?: number }) => (
        link.targetUrl?.includes(id) ? sum + Number(link.clicks ?? 0) : sum
    ), 0);
}

function ctaLabelFor(matchReason: string, payout: number | null) {
    if (matchReason === "Best payout match" || payout !== null) return "Start Highest Paying Offer";
    if (matchReason === "Platform match") return "Compare This Offer";
    return "Start This Offer";
}

export function matchOffersToGuide({
    guide,
    offers,
    guideEventStats,
}: {
    guide: GuideLike;
    offers: OfferLike[];
    guideEventStats?: any;
}) {
    if (guide?.disable_auto_offer_matching && !guide.primary_offer_id) return [];

    const guideGameId = asString(guide?.game_id) ?? asString(guide?.game?.id);
    const guideGameName = asString(guide?.game?.name);
    const guideText = [guide?.title, guide?.keyword_target, guide?.guide_type].filter(Boolean).join(" ");
    const guidePlatform = asString(guide?.platform_name) ?? asString(guide?.platform_filter);
    const guidePlatformId = asString(guide?.platform_id);
    const preferredDevice = asString(guide?.platform_filter);
    const primaryOfferId = asString(guide?.primary_offer_id);

    const scored = (offers ?? [])
        .filter(isOfferLive)
        .map((offer): GuideOfferMatch | null => {
            const id = asString(offer.id);
            if (!id) return null;

            const offerGameId = asString(offer.game_id);
            const offerGameName = asString(offer.game_name);
            const platformName = asString(offer.platform_name);
            const providerName = asString(offer.provider_name);
            const platformId = asString(offer.platform_id);
            const title = asString(offer.title) ?? asString(offer.goal_text) ?? offerGameName ?? "Offer";
            const payout = asNumber(offer.total_payout_usd ?? offer.payout_usd);
            const devices = asStringArray(offer.devices ?? offer.game_devices);
            const countries = asStringArray(offer.countries);
            const offerText = [title, offerGameName, platformName, providerName, offer.category, offer.goal_text].filter(Boolean).join(" ");
            let score = 0;
            let matchReason = "Top available route";

            if (primaryOfferId && id === primaryOfferId) {
                score += 1000;
                matchReason = "Manual primary offer";
            }

            if (guideGameId && offerGameId && guideGameId === offerGameId) {
                score += 120;
                matchReason = payout !== null ? "Best payout match" : "Exact game match";
            } else if (guideGameName && includesNormalized(offerGameName || title, guideGameName)) {
                score += 90;
                matchReason = "Relevant to this guide";
            } else if (offerGameName && includesNormalized(guideText, offerGameName)) {
                score += 75;
                matchReason = "Relevant to this guide";
            }

            if (guidePlatformId && platformId && guidePlatformId === platformId) {
                score += 45;
                if (matchReason === "Top available route") matchReason = "Platform match";
            } else if (guidePlatform && includesNormalized(platformName, guidePlatform)) {
                score += 30;
                if (matchReason === "Top available route") matchReason = "Platform match";
            }

            const keywordTokens = normalize(guideText).split(" ").filter((token) => token.length > 3);
            const offerNormalized = normalize(offerText);
            const keywordMatches = keywordTokens.filter((token) => offerNormalized.includes(token)).length;
            if (keywordMatches > 0) {
                score += Math.min(35, keywordMatches * 7);
                if (matchReason === "Top available route") matchReason = "Keyword match";
            }

            if (preferredDevice && devices.length > 0 && devices.map(normalize).includes(normalize(preferredDevice))) {
                score += 12;
            }

            if (score === 0 && payout !== null) score += 5;

            return {
                id,
                title,
                matchReason,
                score,
                payout,
                platform: platformName,
                provider: providerName,
                targetUrl: buildTrackedUrl(offer),
                platformId,
                source: asString(offer.source),
                devices,
                countries,
                updatedAt: asString(offer.updated_at),
                ctaLabel: ctaLabelFor(matchReason, payout),
            };
        })
        .filter((match): match is GuideOfferMatch => Boolean(match));

    return scored
        .sort((a, b) => {
            const scoreDiff = b.score - a.score;
            if (scoreDiff) return scoreDiff;
            const payoutDiff = (b.payout ?? 0) - (a.payout ?? 0);
            if (payoutDiff) return payoutDiff;
            const ctrDiff = performanceClicks({ id: b.id }, guideEventStats) - performanceClicks({ id: a.id }, guideEventStats);
            if (ctrDiff) return ctrDiff;
            return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
        })
        .slice(0, 5);
}

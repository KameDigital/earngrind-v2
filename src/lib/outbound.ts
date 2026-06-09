export function buildOutboundRedirectUrl({
    affiliateTemplate,
    destinationUrl,
    fallbackUrl,
}: {
    affiliateTemplate: string | null | undefined;
    destinationUrl: string | null | undefined;
    fallbackUrl?: string | null | undefined;
}): string | null {
    const template = affiliateTemplate?.trim() ?? "";
    const destination = sanitizeRedirectTarget(destinationUrl);
    const fallback = sanitizeRedirectTarget(fallbackUrl);

    if (template) {
        if (template.includes("{destination}")) {
            const resolvedDestination = destination || fallback;
            if (!resolvedDestination) return null;
            return sanitizeRedirectTarget(template.replaceAll("{destination}", encodeURIComponent(resolvedDestination)));
        }

        if (template.includes("{custom_param}")) {
            const resolvedDestination = destination || fallback;
            if (!resolvedDestination) return null;
            return sanitizeRedirectTarget(template.replaceAll("{custom_param}", resolvedDestination));
        }

        return sanitizeRedirectTarget(template);
    }

    return destination || fallback || null;
}

type PlatformRedirectTarget = {
    slug?: string | null;
    name?: string | null;
    affiliate_template?: string | null;
};

type CashInStyleOfferTarget = {
    platform?: PlatformRedirectTarget | null;
    provider?: { name?: string | null; slug?: string | null } | null;
    providerOfferId?: string | number | null;
    externalId?: string | null;
    offerUrl?: string | null;
    customParam?: string | null;
};

const GAIN_AFFILIATE_URL = "https://gain.gg/r/macko";
const EARNLAB_AFFILIATE_URL = "https://earnlab.com/r/mac";
const GEMSLOOT_AFFILIATE_URL = "https://gemsloot.com/?aff=kamedev";
export const CASHINSTYLE_AFFILIATE_URL = "https://cashinstyle.com/?ref=earngrind";
const SWAGBUCKS_AFFILIATE_URL = "https://www.swagbucks.com/profile/r_158565078?rp=1";
const KASHKICK_AFFILIATE_URL = "https://app.kashkick.com?ref=MEF2ucEjcbtH";
const INBOXDOLLARS_AFFILIATE_URL = "https://www.inboxdollars.com?rb=193664312";
const MYPOINTS_AFFILIATE_URL = "https://www.mypoints.com?rb=233983902";
const PRIZEREBEL_AFFILIATE_URL = "https://www.prizerebel.com/index.php?r=16580973";
const SCRAMBLY_URL = "https://scrambly.io/";
const GEMSLOOT_OFFER_URL = "https://gemsloot.com/transactions?modal=offer_3";
const PLATFORM_FALLBACK_URLS: Record<string, string> = {
    cashinstyle: CASHINSTYLE_AFFILIATE_URL,
    earnlab: EARNLAB_AFFILIATE_URL,
    gaingg: GAIN_AFFILIATE_URL,
    gain: GAIN_AFFILIATE_URL,
    gemsloot: GEMSLOOT_AFFILIATE_URL,
    freecash: "https://freecash.com",
    swagbucks: SWAGBUCKS_AFFILIATE_URL,
    kashkick: KASHKICK_AFFILIATE_URL,
    inboxdollars: INBOXDOLLARS_AFFILIATE_URL,
    mypoints: MYPOINTS_AFFILIATE_URL,
    prizerebel: PRIZEREBEL_AFFILIATE_URL,
    scrambly: SCRAMBLY_URL,
};

function getPlatformKeys(platform: PlatformRedirectTarget | null | undefined): string[] {
    if (!platform) return [];

    return [platform.slug, platform.name]
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => {
            const normalized = value.replace(/[^a-z0-9]+/g, "");
            return normalized && normalized !== value ? [value, normalized] : [value];
        });
}

export function getPlatformFallbackUrl(platform: PlatformRedirectTarget | null | undefined): string | null {
    for (const candidate of getPlatformKeys(platform)) {
        if (PLATFORM_FALLBACK_URLS[candidate]) {
            return PLATFORM_FALLBACK_URLS[candidate];
        }
    }

    return null;
}

export function getPlatformAffiliateOverride(platform: PlatformRedirectTarget | null | undefined): string | null {
    const candidates = getPlatformKeys(platform);
    if (candidates.some((candidate) => candidate === "cashinstyle" || candidate === "cashinstyles")) {
        return CASHINSTYLE_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "earnlab" || candidate.includes("earnlab"))) {
        return EARNLAB_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "gaingg" || candidate === "gain" || candidate.includes("gaingg"))) {
        return GAIN_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "gemsloot" || candidate.includes("gemsloot"))) {
        return GEMSLOOT_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "swagbucks" || candidate.includes("swagbucks"))) {
        return SWAGBUCKS_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "kashkick" || candidate.includes("kashkick"))) {
        return KASHKICK_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "inboxdollars" || candidate.includes("inboxdollars"))) {
        return INBOXDOLLARS_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "mypoints" || candidate.includes("mypoints"))) {
        return MYPOINTS_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "prizerebel" || candidate.includes("prizerebel"))) {
        return PRIZEREBEL_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "scrambly" || candidate.includes("scrambly"))) {
        return SCRAMBLY_URL;
    }

    return null;
}

export function isGainTarget(platform: PlatformRedirectTarget | null | undefined): boolean {
    return getPlatformKeys(platform)
        .some((candidate) => candidate === "gaingg" || candidate === "gain" || candidate.includes("gaingg"));
}

export function isCashInStyleTarget(
    platform: PlatformRedirectTarget | null | undefined,
    provider?: { name?: string | null; slug?: string | null } | null,
): boolean {
    return [...getPlatformKeys(platform), ...getPlatformKeys(provider)]
        .some((candidate) => candidate === "cashinstyle" || candidate === "cashinstyles");
}

export function isGemslootTarget(platform: PlatformRedirectTarget | null | undefined): boolean {
    return getPlatformKeys(platform)
        .some((candidate) => candidate === "gemsloot" || candidate.includes("gemsloot"));
}

export function extractGemslootOfferName(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? "";
    if (!normalized) return null;

    const directMatch = normalized.match(/([A-Za-z][A-Za-z0-9]*__[A-Za-z0-9_-]+)/);
    return directMatch?.[1]?.replace(/-[A-Z]{2}$/i, "") ?? null;
}

export function buildGemslootOfferModalUrl({
    externalId,
    offerUrl,
}: {
    externalId?: string | null;
    offerUrl?: string | null;
}): string | null {
    const offerName =
        extractGemslootOfferName(externalId) ??
        extractGemslootOfferName(offerUrl);
    if (!offerName) return null;

    const url = new URL(GEMSLOOT_OFFER_URL);
    url.searchParams.set("name", offerName);
    url.searchParams.set("aff", "kamedev");
    return url.toString();
}

export function extractCashInStyleOfferId({
    providerOfferId,
    externalId,
    offerUrl,
    customParam,
}: Pick<CashInStyleOfferTarget, "providerOfferId" | "externalId" | "offerUrl" | "customParam">): string | null {
    const explicitId = normalizeCashInStyleOfferId(providerOfferId);
    if (explicitId) return explicitId;

    const fromExternalId = extractCashInStyleOfferIdFromExternalId(externalId);
    if (fromExternalId) return fromExternalId;

    for (const url of [offerUrl, customParam]) {
        const fromUrl = extractCashInStyleOfferIdFromUrl(url);
        if (fromUrl) return fromUrl;
    }

    return null;
}

export function buildCashInStyleOutboundUrl(target: CashInStyleOfferTarget): string | null {
    if (!isCashInStyleTarget(target.platform, target.provider)) return null;

    const offerId = extractCashInStyleOfferId(target);
    if (!offerId) return CASHINSTYLE_AFFILIATE_URL;

    return `https://cashinstyle.com/walls/offers/${encodeURIComponent(offerId)}?ref=earngrind`;
}

export function buildPlatformAffiliateUrl({
    platform,
    customParam = "earngrind",
}: {
    platform: PlatformRedirectTarget | null | undefined;
    customParam?: string;
}): string | null {
    const override = getPlatformAffiliateOverride(platform);
    if (override) return override;

    const template = platform?.affiliate_template?.trim() ?? "";
    if (template.includes("{custom_param}")) {
        return sanitizeRedirectTarget(template.replaceAll("{custom_param}", customParam));
    }

    return buildOutboundRedirectUrl({
        affiliateTemplate: platform?.affiliate_template,
        destinationUrl: null,
        fallbackUrl: getPlatformFallbackUrl(platform),
    });
}

function sanitizeRedirectTarget(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return null;
    if (isImageUrl(trimmed)) return null;
    if (!isSafeHttpUrl(trimmed)) return null;
    return trimmed;
}

function normalizeCashInStyleOfferId(value: string | number | null | undefined): string | null {
    const normalized = String(value ?? "").trim();
    if (!normalized || /^offer_id$/i.test(normalized)) return null;
    return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : null;
}

function extractCashInStyleOfferIdFromExternalId(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? "";
    if (!normalized) return null;

    const directMatch = normalized.match(/^cashinstyle-(?:[a-z]+-)?([A-Za-z0-9_-]+)$/i);
    if (directMatch) return normalizeCashInStyleOfferId(directMatch[1]);

    return normalizeCashInStyleOfferId(normalized);
}

function extractCashInStyleOfferIdFromUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return null;

    try {
        const url = new URL(trimmed);
        const cashInStyleMatch = url.pathname.match(/\/walls\/offers\/([^/?#]+)/i);
        if (cashInStyleMatch) return normalizeCashInStyleOfferId(decodeURIComponent(cashInStyleMatch[1]));

        const toroxMatch = url.pathname.match(/\/click_track\/track\/([^/?#]+)/i);
        if (toroxMatch) return normalizeCashInStyleOfferId(decodeURIComponent(toroxMatch[1]));
    } catch {
        return null;
    }

    return null;
}

function isSafeHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function isImageUrl(url: string): boolean {
    return /\.(?:jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i.test(url);
}

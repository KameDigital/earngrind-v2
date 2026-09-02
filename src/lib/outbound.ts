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

function getEnvVar(key: string, defaultValue: string): string {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
        return process.env[key]!;
    }
    return defaultValue;
}

const GAIN_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_GAIN_AFFILIATE_URL", "https://gain.gg/r/macko");
const EARNLAB_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_EARNLAB_AFFILIATE_URL", "https://earnlab.com/r/mac");
const EARNLAB_TASK_ID_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-[A-Z]{2})?$/i;
const GEMSLOOT_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_GEMSLOOT_AFFILIATE_URL", "https://gemsloot.com/?aff=kamedev");
export const CASHINSTYLE_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_CASHINSTYLE_AFFILIATE_URL", "https://cashinstyle.com/?ref=earngrind");
const SWAGBUCKS_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_SWAGBUCKS_AFFILIATE_URL", "https://www.swagbucks.com/profile/r_158565078?rp=1");
const KASHKICK_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_KASHKICK_AFFILIATE_URL", "https://app.kashkick.com?ref=MEF2ucEjcbtH");
const INBOXDOLLARS_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_INBOXDOLLARS_AFFILIATE_URL", "https://www.inboxdollars.com?rb=193664312");
const MYPOINTS_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_MYPOINTS_AFFILIATE_URL", "https://www.mypoints.com?rb=233983902");
const PRIZEREBEL_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_PRIZEREBEL_AFFILIATE_URL", "https://www.prizerebel.com/index.php?r=16580973");
const SCRAMBLY_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_SCRAMBLY_AFFILIATE_URL", "https://scrambly.io/?ref=3P5OXUA");
const FREECASH_AFFILIATE_URL = getEnvVar("NEXT_PUBLIC_FREECASH_AFFILIATE_URL", "https://freecash.com/?ref=earngrind");
const GEMSLOOT_OFFER_URL = "https://gemsloot.com/transactions?modal=offer_3";

const PLATFORM_FALLBACK_URLS: Record<string, string> = {
    cashinstyle: CASHINSTYLE_AFFILIATE_URL,
    earnlab: EARNLAB_AFFILIATE_URL,
    gaingg: GAIN_AFFILIATE_URL,
    gain: GAIN_AFFILIATE_URL,
    gemsloot: GEMSLOOT_AFFILIATE_URL,
    freecash: FREECASH_AFFILIATE_URL,
    swagbucks: SWAGBUCKS_AFFILIATE_URL,
    kashkick: KASHKICK_AFFILIATE_URL,
    inboxdollars: INBOXDOLLARS_AFFILIATE_URL,
    mypoints: MYPOINTS_AFFILIATE_URL,
    prizerebel: PRIZEREBEL_AFFILIATE_URL,
    scrambly: SCRAMBLY_AFFILIATE_URL,
};

export function buildEarnLabOfferBacklink(externalId: string | null | undefined): string | null {
    const taskId = externalId?.trim().match(EARNLAB_TASK_ID_PATTERN)?.[1];
    if (!taskId) return null;

    const url = new URL("https://earnlab.com/tasks");
    url.searchParams.set("modal", "task");
    url.searchParams.set("task-id", taskId);
    url.searchParams.set("code", "mac");
    return url.toString();
}

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
        return SCRAMBLY_AFFILIATE_URL;
    }
    if (candidates.some((candidate) => candidate === "freecash" || candidate.includes("freecash"))) {
        return FREECASH_AFFILIATE_URL;
    }

    return null;
}

export function isGainTarget(platform: PlatformRedirectTarget | null | undefined): boolean {
    return getPlatformKeys(platform)
        .some((candidate) => candidate === "gaingg" || candidate === "gain" || candidate.includes("gaingg"));
}

export function isEarnLabTarget(platform: PlatformRedirectTarget | null | undefined): boolean {
    return getPlatformKeys(platform)
        .some((candidate) => candidate === "earnlab" || candidate.includes("earnlab"));
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

export function attachAffiliateParams(
    destinationUrl: string | null | undefined,
    platform: PlatformRedirectTarget | null | undefined,
): string | null {
    const destination = sanitizeRedirectTarget(destinationUrl);
    if (!destination) return null;

    try {
        const url = new URL(destination);
        const candidates = getPlatformKeys(platform);

        if (candidates.some((c) => c === "earnlab" || c.includes("earnlab"))) {
            if (url.pathname === "/tasks" && !url.searchParams.has("task-id")) {
                return EARNLAB_AFFILIATE_URL;
            }
            if (!url.searchParams.has("code") && !url.searchParams.has("ref")) {
                url.searchParams.set("code", "mac");
            }
        } else if (candidates.some((c) => c === "gaingg" || c === "gain" || c.includes("gaingg"))) {
            if (!url.searchParams.has("ref")) {
                url.searchParams.set("ref", "macko");
            }
        } else if (candidates.some((c) => c === "gemsloot" || c.includes("gemsloot"))) {
            if (!url.searchParams.has("aff")) {
                url.searchParams.set("aff", "kamedev");
            }
        } else if (candidates.some((c) => c === "cashinstyle" || c.includes("cashinstyle"))) {
            if (!url.searchParams.has("ref")) {
                url.searchParams.set("ref", "earngrind");
            }
        } else if (candidates.some((c) => c === "swagbucks" || c.includes("swagbucks"))) {
            if (!url.searchParams.has("rp") && !url.searchParams.has("rb")) {
                url.searchParams.set("rp", "1");
            }
        } else if (candidates.some((c) => c === "kashkick" || c.includes("kashkick"))) {
            if (!url.searchParams.has("ref")) {
                url.searchParams.set("ref", "MEF2ucEjcbtH");
            }
        } else if (candidates.some((c) => c === "inboxdollars" || c.includes("inboxdollars"))) {
            if (!url.searchParams.has("rb")) {
                url.searchParams.set("rb", "193664312");
            }
        } else if (candidates.some((c) => c === "mypoints" || c.includes("mypoints"))) {
            if (!url.searchParams.has("rb")) {
                url.searchParams.set("rb", "233983902");
            }
        } else if (candidates.some((c) => c === "prizerebel" || c.includes("prizerebel"))) {
            if (!url.searchParams.has("r")) {
                url.searchParams.set("r", "16580973");
            }
        } else if (candidates.some((c) => c === "freecash" || c.includes("freecash"))) {
            if (!url.searchParams.has("ref") && !url.searchParams.has("r")) {
                url.searchParams.set("ref", "earngrind");
            }
        } else if (candidates.some((c) => c === "scrambly" || c.includes("scrambly"))) {
            if (!url.searchParams.has("ref") && !url.searchParams.has("code")) {
                url.searchParams.set("ref", "3P5OXUA");
            }
        }

        return url.toString();
    } catch {
        return destination;
    }
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

    for (const url of [offerUrl, customParam]) {
        const fromUrl = extractCashInStyleOfferIdFromUrl(url);
        if (fromUrl) return fromUrl;
    }

    const fromExternalId = extractCashInStyleOfferIdFromExternalId(externalId);
    if (fromExternalId) return fromExternalId;

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
    destinationUrl,
}: {
    platform: PlatformRedirectTarget | null | undefined;
    customParam?: string;
    destinationUrl?: string | null | undefined;
}): string | null {
    const platformDestination = getPlatformOwnedDestination(platform, destinationUrl);
    if (platformDestination) return attachAffiliateParams(platformDestination, platform);

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

function getPlatformOwnedDestination(
    platform: PlatformRedirectTarget | null | undefined,
    destinationUrl: string | null | undefined,
): string | null {
    const destination = sanitizeRedirectTarget(destinationUrl);
    if (!destination) return null;

    const platformHosts = [
        getPlatformAffiliateOverride(platform),
        getPlatformFallbackUrl(platform),
    ]
        .map((value) => hostnameFromUrl(value))
        .filter((value): value is string => Boolean(value));

    const destinationHost = hostnameFromUrl(destination);
    if (!destinationHost || !platformHosts.includes(destinationHost)) return null;

    return destination;
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

    // Imported CashInStyle rows use `cashinstyle-cashinstyle-<offer-id>-<country>`.
    // The country is catalog metadata, not part of the provider offer id.
    const importedMatch = normalized.match(/^cashinstyle-cashinstyle-(\d+)(?:-[a-z]{2})?$/i);
    if (importedMatch) return normalizeCashInStyleOfferId(importedMatch[1]);

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

function hostnameFromUrl(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
        return null;
    }
}

function isImageUrl(url: string): boolean {
    return /\.(?:jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i.test(url);
}

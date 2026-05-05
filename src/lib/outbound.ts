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

const GAIN_AFFILIATE_URL = "https://gain.gg/r/macko";
const EARNLAB_AFFILIATE_URL = "https://earnlab.com/r/mac";
const GEMSLOOT_AFFILIATE_URL = "https://gemsloot.com/?aff=kamedev";
const SWAGBUCKS_AFFILIATE_URL = "https://www.swagbucks.com/profile/r_158565078?rp=1";
const KASHKICK_AFFILIATE_URL = "https://app.kashkick.com?ref=MEF2ucEjcbtH";
const INBOXDOLLARS_AFFILIATE_URL = "https://www.inboxdollars.com?rb=193664312";
const MYPOINTS_AFFILIATE_URL = "https://www.mypoints.com?rb=233983902";
const PRIZEREBEL_AFFILIATE_URL = "https://www.prizerebel.com/index.php?r=16580973";
const SCRAMBLY_URL = "https://scrambly.io/";
const PLATFORM_FALLBACK_URLS: Record<string, string> = {
    earnlab: EARNLAB_AFFILIATE_URL,
    gaingg: "https://gain.gg",
    gain: "https://gain.gg",
    gemsloot: "https://gemsloot.com",
    freecash: "https://freecash.com",
    swagbucks: "https://www.swagbucks.com",
    inboxdollars: "https://www.inboxdollars.com",
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

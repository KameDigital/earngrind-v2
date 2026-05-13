const DEFAULT_GAIN_GG_REF = "macko";

const GAIN_OFFER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
const ORIGINAL_GAIN_OFFER_ID_PATTERN = /^\d{1,12}-[a-f0-9]{4}$/i;
const NATIVE_GAIN_EXTERNAL_ID_PATTERN = /^gain-native-(.+)-([A-Z]{2})$/i;
const NON_NATIVE_GAIN_EXTERNAL_ID_PATTERN = /^(?:gain-)?(?:adtowall|asmwall|cpx|lootably|mychips|revu)-/i;

type NamedTarget = {
    name?: string | null;
    slug?: string | null;
};

export function getGainOfferRef(): string {
    const ref = process.env.GAIN_GG_REF?.trim() || DEFAULT_GAIN_GG_REF;
    return /^[A-Za-z0-9_-]{1,64}$/.test(ref) ? ref : DEFAULT_GAIN_GG_REF;
}

export function normalizeGainOfferId(value: string | null | undefined): string | null {
    const id = value?.trim() ?? "";
    if (!id) return null;
    if (id.includes("/") || id.includes("?") || id.includes("#")) return null;
    if (/^(offer_id|undefined|null|unknown)$/i.test(id)) return null;
    return GAIN_OFFER_ID_PATTERN.test(id) ? id : null;
}

export function normalizeOriginalGainOfferId(value: string | null | undefined): string | null {
    const id = normalizeGainOfferId(value);
    return id && ORIGINAL_GAIN_OFFER_ID_PATTERN.test(id) ? id : null;
}

export function buildGainOfferDeepLink(gainOfferId: string): string | null {
    const id = normalizeOriginalGainOfferId(gainOfferId);
    if (!id) return null;

    const url = new URL(`https://gain.gg/offer/${encodeURIComponent(id)}`);
    url.searchParams.set("ref", getGainOfferRef());
    return url.toString();
}

export function extractNativeGainOfferIdFromExternalId(externalId: string | null | undefined): string | null {
    const value = externalId?.trim() ?? "";
    const match = value.match(NATIVE_GAIN_EXTERNAL_ID_PATTERN);
    return match ? normalizeOriginalGainOfferId(match[1]) : null;
}

export function extractNativeGainOfferIdFromSiteOffer({
    externalId,
    site,
    provider,
}: {
    externalId: string | null | undefined;
    site?: NamedTarget | null;
    provider?: NamedTarget | null;
}): string | null {
    const value = externalId?.trim() ?? "";
    if (!value || NON_NATIVE_GAIN_EXTERNAL_ID_PATTERN.test(value)) return null;

    const wrappedId = extractNativeGainOfferIdFromExternalId(value);
    if (wrappedId) return wrappedId;

    if (!isGainSite(site) || !isNativeGainProvider(provider)) return null;
    return normalizeOriginalGainOfferId(value);
}

export function buildGainOfferDeepLinkFromSiteOffer(target: {
    externalId: string | null | undefined;
    site?: NamedTarget | null;
    provider?: NamedTarget | null;
}): string | null {
    const gainOfferId = extractNativeGainOfferIdFromSiteOffer(target);
    return gainOfferId ? buildGainOfferDeepLink(gainOfferId) : null;
}

export function isGainOfferDeepLink(value: string | null | undefined): boolean {
    const raw = value?.trim() ?? "";
    if (!raw) return false;
    try {
        const url = new URL(raw);
        return url.hostname.replace(/^www\./i, "").toLowerCase() === "gain.gg" &&
            /^\/offer\/[^/]+$/i.test(url.pathname) &&
            Boolean(normalizeOriginalGainOfferId(decodeURIComponent(url.pathname.split("/").pop() ?? "")));
    } catch {
        return false;
    }
}

function isGainSite(site: NamedTarget | null | undefined): boolean {
    return getTargetKeys(site).some((key) => key === "gain" || key === "gaingg" || key === "gain-gg");
}

function isNativeGainProvider(provider: NamedTarget | null | undefined): boolean {
    return getTargetKeys(provider).some((key) => key === "torox" || key === "gain" || key === "gaingg" || key === "gain-gg");
}

function getTargetKeys(target: NamedTarget | null | undefined): string[] {
    return [target?.slug, target?.name]
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => {
            const compact = value.replace(/[^a-z0-9]+/g, "");
            return compact && compact !== value ? [value, compact] : [value];
        });
}

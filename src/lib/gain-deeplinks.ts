const DEFAULT_GAIN_GG_REF = "macko";

const GAIN_OFFER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
const GAIN_WALLS_WITH_NATIVE_OFFER_IDS = new Set(["native"]);

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

export function buildGainOfferDeepLink(gainOfferId: string): string | null {
    const id = normalizeGainOfferId(gainOfferId);
    if (!id) return null;

    const url = new URL(`https://gain.gg/offer/${encodeURIComponent(id)}`);
    url.searchParams.set("ref", getGainOfferRef());
    return url.toString();
}

export function extractNativeGainOfferIdFromExternalId(externalId: string | null | undefined): string | null {
    const value = externalId?.trim() ?? "";
    const match = value.match(/^gain-([a-z0-9-]+)-(.+)-([A-Z]{2})$/i);
    if (!match) return null;

    const wall = match[1].toLowerCase();
    if (!GAIN_WALLS_WITH_NATIVE_OFFER_IDS.has(wall)) return null;

    return normalizeGainOfferId(match[2]);
}

export function isGainOfferDeepLink(value: string | null | undefined): boolean {
    const raw = value?.trim() ?? "";
    if (!raw) return false;
    try {
        const url = new URL(raw);
        return url.hostname.replace(/^www\./i, "").toLowerCase() === "gain.gg" &&
            /^\/offer\/[^/]+$/i.test(url.pathname) &&
            Boolean(normalizeGainOfferId(decodeURIComponent(url.pathname.split("/").pop() ?? "")));
    } catch {
        return false;
    }
}

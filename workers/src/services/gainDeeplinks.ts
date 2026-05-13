const DEFAULT_GAIN_GG_REF = "macko";
const GAIN_OFFER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;

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

    const ref = process.env.GAIN_GG_REF?.trim() || DEFAULT_GAIN_GG_REF;
    const safeRef = /^[A-Za-z0-9_-]{1,64}$/.test(ref) ? ref : DEFAULT_GAIN_GG_REF;
    const url = new URL(`https://gain.gg/offer/${encodeURIComponent(id)}`);
    url.searchParams.set("ref", safeRef);
    return url.toString();
}

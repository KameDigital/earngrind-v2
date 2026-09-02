import { inferFallbackTaskType, toDbTaskType } from "@/lib/offer-quality";
import type {
    NormalizedProviderGalleryOffer,
    ProviderGalleryConfig,
    ProviderGalleryDbTaskType,
    ProviderGalleryTask,
} from "./types";

export function slugifyGalleryValue(value: string, fallback = "gallery-offer"): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || fallback;
}

export function normalizeGalleryCountryCode(value: string | null | undefined): string | null {
    const normalized = value?.trim().toUpperCase() ?? "";
    return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function normalizeGalleryDevices(values: string[] | null | undefined): string[] {
    const devices = new Set<string>();
    for (const value of values ?? []) {
        const normalized = value.trim().toLowerCase();
        if (normalized === "ios" || normalized === "iphone" || normalized === "ipad") devices.add("ios");
        if (normalized === "android") devices.add("android");
        if (["pc", "desktop", "windows", "mac"].includes(normalized)) devices.add("pc");
        if (normalized === "web" || normalized === "browser") devices.add("web");
    }
    if (devices.size === 0) devices.add("web");
    return Array.from(devices);
}

export function normalizeGalleryCountries(offer: NormalizedProviderGalleryOffer): string[] {
    const countries = (offer.countries?.length ? offer.countries : [offer.countryCode])
        .map((country) => normalizeGalleryCountryCode(country))
        .filter((country): country is string => Boolean(country));
    return Array.from(new Set(countries.length > 0 ? countries : [offer.countryCode]));
}

export function normalizeGalleryTaskType(value: string | null | undefined, title = ""): ProviderGalleryDbTaskType {
    const dbType = toDbTaskType(value);
    if (dbType !== "other") return dbType;
    if (value === "other") return "other";
    return inferFallbackTaskType(`${value ?? ""} ${title}`);
}

export function normalizeGalleryTasks(offer: NormalizedProviderGalleryOffer): Required<ProviderGalleryTask>[] {
    const sourceTasks = offer.tasks?.length
        ? offer.tasks
        : [{
            title: offer.requirements?.[0] ?? offer.shortDescription ?? offer.title,
            rewardAmount: offer.payoutUsd,
            rewardDisplay: formatUsd(offer.payoutUsd),
            taskType: "other",
            timeLimitText: null,
            notes: offer.description ?? null,
            sortOrder: 1,
        }];

    return sourceTasks.map((task, index) => {
        const title = cleanText(task.title || offer.title) || "Complete offer";
        const rewardAmount = normalizeMoney(task.rewardAmount);
        return {
            title,
            rewardAmount,
            rewardDisplay: task.rewardDisplay ?? formatUsd(rewardAmount),
            taskType: normalizeGalleryTaskType(task.taskType, title),
            timeLimitText: task.timeLimitText ?? null,
            notes: task.notes ?? null,
            sortOrder: Number.isFinite(task.sortOrder) ? Number(task.sortOrder) : index + 1,
        };
    });
}

export function buildProviderGalleryExternalId(
    config: ProviderGalleryConfig,
    offer: NormalizedProviderGalleryOffer,
): string {
    if (typeof config.externalIdStrategy === "function") {
        return config.externalIdStrategy(offer);
    }

    const platform = slugifyGalleryValue(config.platformSlug);
    const provider = slugifyGalleryValue(offer.sourceProviderSlug || offer.providerDisplayName);
    const source = slugifyGalleryValue(offer.sourceOfferId, "source");
    const country = normalizeGalleryCountryCode(offer.countryCode) ?? "XX";

    if (config.externalIdStrategy === "source-country") return `${source}-${country}`;
    if (config.externalIdStrategy === "provider-source-country") return `${provider}-${source}-${country}`;
    return `${platform}-${provider}-${source}-${country}`;
}

export function buildLegacyExternalIds(
    config: ProviderGalleryConfig,
    offer: NormalizedProviderGalleryOffer,
): string[] {
    const ids = new Set<string>();
    if (config.key === "earnlab") {
        ids.add(offer.sourceOfferId);
    }
    return Array.from(ids);
}

export function safeDirectOfferUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return null;
    if (/\bCLICKID\b|\{clickid\}|\[clickid\]|%7Bclickid%7D/i.test(trimmed)) return null;
    if (/^offer_id$/i.test(trimmed)) return null;
    try {
        const url = new URL(trimmed);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
        if (/\.(?:jpg|jpeg|png|webp|gif|avif|svg)(?:$|[?#])/i.test(url.pathname)) return null;
        return url.toString();
    } catch {
        return null;
    }
}

export function cleanText(value: string | null | undefined): string {
    return (value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeMoney(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

export function formatUsd(value: number): string {
    return `$${normalizeMoney(value).toFixed(2)}`;
}

export function safeImageUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return null;
    if (/\bCLICKID\b|\{clickid\}|\[clickid\]/i.test(trimmed)) return null;
    try {
        const url = new URL(trimmed);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
        return url.toString();
    } catch {
        return null;
    }
}

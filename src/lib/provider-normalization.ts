const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
    "adscend media": "AdscendMedia",
    adscendmedia: "AdscendMedia",
    "ayet studios": "AyetStudios",
    ayetstudios: "AyetStudios",
    "earn lab": "EarnLab",
    earnlab: "EarnLab",
    offertoro: "Torox",
    revu: "RevU",
    "revenue universe": "RevU",
    torox: "Torox",
    toroxio: "Torox",
};

export function normalizeProviderDisplayName(value: string | null | undefined): string {
    const raw = value?.trim() ?? "";
    if (!raw) return "Unknown Provider";
    const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
    const compactKey = key.replace(/\s+/g, "");
    return PROVIDER_DISPLAY_NAMES[key] ?? PROVIDER_DISPLAY_NAMES[compactKey] ?? raw;
}

export function providerDisplayKey(value: string | null | undefined): string {
    return normalizeProviderDisplayName(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function groupProviderVariants(values: Array<string | null | undefined>): Record<string, string[]> {
    const groups = new Map<string, Set<string>>();
    for (const value of values) {
        const raw = value?.trim();
        if (!raw) continue;
        const canonical = normalizeProviderDisplayName(raw);
        const set = groups.get(canonical) ?? new Set<string>();
        set.add(raw);
        groups.set(canonical, set);
    }
    return Object.fromEntries(
        Array.from(groups.entries())
            .filter(([, variants]) => variants.size > 1)
            .map(([canonical, variants]) => [canonical, Array.from(variants).sort()]),
    );
}

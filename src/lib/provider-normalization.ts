const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
    "adgate media": "AdGate Media",
    adgatemedia: "AdGate Media",
    adgate: "AdGate Media",
    adgem: "AdGem",
    "adscend media": "AdscendMedia",
    adscendmedia: "AdscendMedia",
    "adscend media inc": "AdscendMedia",
    adt: "AdToWall",
    adtowall: "AdToWall",
    "ad to wall": "AdToWall",
    "aye-t studios": "Aye-T Studios",
    "ayet studios": "Aye-T Studios",
    ayetstudios: "Aye-T Studios",
    "aye t studios": "Aye-T Studios",
    besitos: "Besitos",
    bitlabs: "BitLabs",
    "earn lab": "EarnLab",
    earnlab: "EarnLab",
    gemsloot: "Gemsloot",
    "hang my ads": "Hang My Ads",
    hangmyads: "Hang My Ads",
    lootably: "Lootably",
    "mm wall": "MM Wall",
    mmwall: "MM Wall",
    monlix: "Monlix",
    "my chips": "MyChips",
    mychips: "MyChips",
    offertoro: "Torox",
    "prime earn": "Prime Earn",
    primeearn: "Prime Earn",
    revu: "RevU",
    "revenue universe": "RevU",
    "time wall": "Time Wall",
    timewall: "Time Wall",
    torox: "Torox",
    toroxio: "Torox",
    "tyr game center": "Tyr Game Center",
    tyrgamecenter: "Tyr Game Center",
    tyrads: "TyrAds",
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

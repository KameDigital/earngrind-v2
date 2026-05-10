import type {
    ProviderGalleryDbClient,
    ProviderGalleryQualityReport,
} from "./types";

export async function buildProviderGalleryQualityReport(
    db: ProviderGalleryDbClient,
    options: {
        label: string;
        externalIdLike: string;
        limit?: number;
    },
): Promise<ProviderGalleryQualityReport> {
    const { data, error } = await db
        .from("site_offers")
        .select(`
            id, external_id, payout_usd, image_url, countries, status,
            provider:providers(name),
            game:games(slug),
            tasks:site_offer_tasks(id)
        `)
        .like("external_id", options.externalIdLike)
        .limit(options.limit ?? 5000);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<Record<string, any>>;
    const externalCounts = new Map<string, number>();
    const byProvider: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let missingImages = 0;
    let zeroOrLowPayouts = 0;
    let missingTasks = 0;
    let brokenGameSlugs = 0;

    for (const row of rows) {
        const externalId = String(row.external_id ?? "");
        externalCounts.set(externalId, (externalCounts.get(externalId) ?? 0) + 1);
        increment(byProvider, firstRelated(row.provider)?.name ?? "Unknown");
        increment(byStatus, String(row.status ?? "unknown"));

        const countries = Array.isArray(row.countries) ? row.countries : [];
        if (countries.length === 0) increment(byCountry, "Unknown");
        for (const country of countries) increment(byCountry, String(country).toUpperCase());

        if (!row.image_url) missingImages += 1;
        if (Number(row.payout_usd ?? 0) <= 0.01) zeroOrLowPayouts += 1;
        if (!Array.isArray(row.tasks) || row.tasks.length === 0) missingTasks += 1;

        const slug = String(firstRelated(row.game)?.slug ?? "");
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) brokenGameSlugs += 1;
    }

    return {
        label: options.label,
        totalRows: rows.length,
        byProvider,
        byCountry,
        byStatus,
        missingImages,
        zeroOrLowPayouts,
        missingTasks,
        duplicateExternalIds: Array.from(externalCounts.values()).filter((count) => count > 1).length,
        brokenGameSlugs,
    };
}

function increment(record: Record<string, number>, key: string): void {
    record[key] = (record[key] ?? 0) + 1;
}

function firstRelated(value: unknown): any {
    return Array.isArray(value) ? value[0] ?? null : value;
}

"use client";

import { useState } from "react";
import { EARNLAB_COUNTRY_NAMES, EARNLAB_GALLERY_COUNTRIES } from "@/lib/earnlab-countries";
import ProviderGalleryImportPanel, { ProviderGalleryPanelStats } from "./ProviderGalleryImportPanel";

type ImportResult = {
    countryCode: string;
    countryName: string;
    stats: ProviderGalleryPanelStats;
};

export default function EarnLabGalleryImportPanel() {
    const [country, setCountry] = useState("US");
    const [limit, setLimit] = useState(50);

    return (
        <ProviderGalleryImportPanel<ImportResult>
            providerName="EarnLab"
            eyebrow="EarnLab gallery import"
            title="Pull country-specific EarnLab offers"
            description="Fetches the EarnLab gallery API by country and upserts results into site_offers through the shared provider-gallery ingestion path. Direct per-offer links are preserved if they already exist."
            endpoint="/api/admin/earnlab/gallery-import"
            tone="lime"
            buildRequestBody={() => ({ country, limit, refresh: true })}
            getStats={(result) => result.stats}
            fields={(
                <>
                    <label className="block w-40">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Country</span>
                        <select
                            value={country}
                            onChange={(event) => setCountry(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        >
                            {EARNLAB_GALLERY_COUNTRIES.map((code) => (
                                <option key={code} value={code}>
                                    {code} - {EARNLAB_COUNTRY_NAMES[code]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block w-28">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Limit</span>
                        <input
                            type="number"
                            min={1}
                            max={75}
                            value={limit}
                            onChange={(event) => setLimit(Math.min(75, Math.max(1, Number(event.target.value) || 1)))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        />
                    </label>
                </>
            )}
        />
    );
}

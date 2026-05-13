import { AdminButtonLink, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { requireAdminOrEditor } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EarnLabGalleryImportPanel from "./EarnLabGalleryImportPanel";
import GainGalleryImportPanel from "./GainGalleryImportPanel";
import GemslootGalleryImportPanel from "./GemslootGalleryImportPanel";
import { getPublicOfferMinPayout, normalizeTotalPayout } from "@/lib/offer-quality";
import { groupProviderVariants, normalizeProviderDisplayName } from "@/lib/provider-normalization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Offers | Admin" };

const STATUS_STYLES: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-500",
    boosted: "bg-purple-100 text-purple-800",
    paused: "bg-yellow-100 text-yellow-700",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminSiteOffersPage({ searchParams = {} }: { searchParams?: SearchParams }) {
    const auth = await requireAdminOrEditor();
    if (!auth.ok) redirect(auth.status === 401 ? "/login" : "/app/dashboard");
    const { supabase } = auth;

    const filters = normalizeFilters(searchParams);
    const { data: siteOffers } = await supabase
        .from("site_offers")
        .select(`
            id, external_id, payout_usd, total_payout_usd, status, goal_text, updated_at, image_url, offer_url, countries, devices,
            game:games(name, slug, category),
            site:platforms(name),
            provider:providers(name),
            tasks:site_offer_tasks(id)
        `)
        .in("status", ["active", "expired", "boosted", "paused"])
        .order("updated_at", { ascending: false })
        .limit(500);

    const rows = sortRows(filterRows(siteOffers ?? [], filters), filters.sort).slice(0, 200);
    const providerOptions = Array.from(new Set((siteOffers ?? []).map((offer) => normalizeProviderDisplayName(firstRelated(offer.provider)?.name)).filter(Boolean))).sort();
    const diagnostics = buildDiagnostics(siteOffers ?? []);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                eyebrow="Offers"
                title="Manual Offers"
                description="Curated site_offers records that power comparison routes on game and guide pages."
                actions={<AdminButtonLink href="/app/admin/site-offers/new" variant="primary">New entry</AdminButtonLink>}
            />

            <EarnLabGalleryImportPanel />
            <GainGalleryImportPanel />
            <GemslootGalleryImportPanel />

            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700">Data quality</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <AdminStatCard label="Missing tasks" value={diagnostics.missingTasks} tone={diagnostics.missingTasks ? "warning" : "good"} />
                    <AdminStatCard label="Missing images" value={diagnostics.missingImages} tone={diagnostics.missingImages ? "warning" : "good"} />
                    <AdminStatCard label="Missing URLs" value={diagnostics.missingUrls} tone={diagnostics.missingUrls ? "warning" : "good"} />
                    <AdminStatCard label="Low payout" value={diagnostics.lowPayouts} tone={diagnostics.lowPayouts ? "warning" : "good"} />
                    <AdminStatCard label="Total < payout" value={diagnostics.totalBelowPayout} tone={diagnostics.totalBelowPayout ? "warning" : "good"} />
                    <AdminStatCard label="Provider variants" value={diagnostics.providerVariantGroups} tone={diagnostics.providerVariantGroups ? "warning" : "good"} />
                </div>
                <p className="mt-3 text-xs font-medium text-amber-800">
                    Snapshot is based on the latest loaded admin rows. Full checks live in scripts/audit-offer-data-quality.mjs.
                </p>
            </section>

            <form className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" action="/app/admin/site-offers">
                <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-9">
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Gain only</span>
                        <select name="gain" defaultValue={filters.gain ? "1" : ""} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold">
                            <option value="">All offers</option>
                            <option value="1">Gain imports</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Wall</span>
                        <input name="wall" defaultValue={filters.wall} placeholder="lootably" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Provider</span>
                        <select name="provider" defaultValue={filters.provider} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold">
                            <option value="">Any</option>
                            {providerOptions.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Country</span>
                        <input name="country" defaultValue={filters.country} placeholder="US" maxLength={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold uppercase" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Min payout</span>
                        <input name="minPayout" defaultValue={filters.minPayout || ""} type="number" min={0} step="0.01" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</span>
                        <input name="category" defaultValue={filters.category} placeholder="Game" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Media</span>
                        <select name="media" defaultValue={filters.media} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold">
                            <option value="">Any</option>
                            <option value="image">Has image</option>
                            <option value="url">Has direct URL</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Device</span>
                        <input name="device" defaultValue={filters.device} placeholder="android" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold" />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Sort</span>
                        <select name="sort" defaultValue={filters.sort} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold">
                            <option value="updated">Updated</option>
                            <option value="payout">Payout</option>
                            <option value="total">Total payout</option>
                            <option value="provider">Provider</option>
                            <option value="title">Title</option>
                        </select>
                    </label>
                </div>
                <div className="mt-3 flex gap-2">
                    <button className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white">Apply filters</button>
                    <Link href="/app/admin/site-offers" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Clear</Link>
                </div>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStatCard label="Active" value={rows.filter((offer) => offer.status === "active").length} tone="good" />
                <AdminStatCard label="Boosted" value={rows.filter((offer) => offer.status === "boosted").length} />
                <AdminStatCard label="Paused" value={rows.filter((offer) => offer.status === "paused").length} tone="warning" />
                <AdminStatCard label="Expired" value={rows.filter((offer) => offer.status === "expired").length} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Game</th>
                                <th className="px-4 py-3 text-left">Site</th>
                                <th className="px-4 py-3 text-left">Provider</th>
                                <th className="px-4 py-3 text-right">Payout</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="hidden px-4 py-3 text-left lg:table-cell">Goal</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((offer) => {
                                const game = Array.isArray(offer.game) ? offer.game[0] : offer.game;
                                const site = Array.isArray(offer.site) ? offer.site[0] : offer.site;
                                const provider = Array.isArray(offer.provider) ? offer.provider[0] : offer.provider;
                                const normalizedProviderName = normalizeProviderDisplayName(provider?.name);
                                const payout = Number(offer.payout_usd ?? 0);
                                const totalPayout = normalizeTotalPayout(payout, Number(offer.total_payout_usd ?? payout));
                                const lowPayout = payout < getPublicOfferMinPayout() || totalPayout < getPublicOfferMinPayout();

                                return (
                                    <tr key={offer.id} className="transition-colors hover:bg-gray-50">
                                        <td className="min-w-[180px] px-4 py-3 font-semibold text-gray-900">
                                            {game?.slug ? (
                                                <Link href={`/offers/${game.slug}`} className="hover:text-blue-600" target="_blank">
                                                    {game.name ?? "-"}
                                                </Link>
                                            ) : (game?.name ?? "-")}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{site?.name ?? "-"}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{normalizedProviderName}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            <span className={lowPayout ? "text-amber-700" : ""}>${payout.toFixed(2)}</span>
                                            {lowPayout ? <div className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Low payout</div> : null}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[offer.status] ?? "bg-gray-100 text-gray-500"}`}>
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td className="hidden max-w-[240px] truncate px-4 py-3 text-xs text-gray-400 lg:table-cell">
                                            {[extractGainWallFromExternalId(offer.external_id ?? ""), offer.goal_text].filter(Boolean).join(" / ") || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/app/admin/site-offers/${offer.id}/edit`}
                                                className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-900 hover:text-white"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {rows.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="text-sm font-semibold text-gray-600">No manual offers yet</div>
                        <p className="mb-3 mt-1 text-xs text-gray-400">
                            Create curated offers that appear in comparison sections.
                        </p>
                        <AdminButtonLink href="/app/admin/site-offers/new" variant="primary">Add the first entry</AdminButtonLink>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function normalizeFilters(searchParams: SearchParams) {
    return {
        gain: firstParam(searchParams.gain) === "1",
        wall: firstParam(searchParams.wall).toLowerCase(),
        provider: firstParam(searchParams.provider),
        country: firstParam(searchParams.country).toUpperCase(),
        minPayout: Number(firstParam(searchParams.minPayout)) || 0,
        category: firstParam(searchParams.category).toLowerCase(),
        media: firstParam(searchParams.media),
        device: firstParam(searchParams.device).toLowerCase(),
        sort: firstParam(searchParams.sort) || "updated",
    };
}

function filterRows<T extends Record<string, any>>(rows: T[], filters: ReturnType<typeof normalizeFilters>): T[] {
    return rows.filter((row) => {
        const externalId = String(row.external_id ?? "");
        const providerName = normalizeProviderDisplayName(firstRelated(row.provider)?.name);
        const countries = Array.isArray(row.countries) ? row.countries.map((country) => String(country).toUpperCase()) : [];
        const devices = Array.isArray(row.devices) ? row.devices.map((device) => String(device).toLowerCase()) : [];
        if (filters.gain && !externalId.startsWith("gain-")) return false;
        if (filters.wall && extractGainWallFromExternalId(externalId) !== filters.wall) return false;
        if (filters.provider && providerName !== normalizeProviderDisplayName(filters.provider)) return false;
        if (filters.country && !countries.includes(filters.country)) return false;
        if (filters.minPayout && Number(row.payout_usd ?? 0) < filters.minPayout) return false;
        if (filters.category && String(firstRelated(row.game)?.category ?? "").toLowerCase() !== filters.category) return false;
        if (filters.media === "image" && !row.image_url) return false;
        if (filters.media === "url" && !row.offer_url) return false;
        if (filters.device && !devices.includes(filters.device)) return false;
        return true;
    });
}

function sortRows<T extends Record<string, any>>(rows: T[], sort: string): T[] {
    return [...rows].sort((left, right) => {
        if (sort === "payout") return Number(right.payout_usd ?? 0) - Number(left.payout_usd ?? 0);
        if (sort === "total") return Number(right.total_payout_usd ?? 0) - Number(left.total_payout_usd ?? 0);
        if (sort === "provider") return normalizeProviderDisplayName(firstRelated(left.provider)?.name).localeCompare(normalizeProviderDisplayName(firstRelated(right.provider)?.name));
        if (sort === "title") return String(firstRelated(left.game)?.name ?? "").localeCompare(String(firstRelated(right.game)?.name ?? ""));
        return String(right.updated_at ?? "").localeCompare(String(left.updated_at ?? ""));
    });
}

function firstParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function firstRelated(value: unknown): any {
    return Array.isArray(value) ? value[0] ?? null : value;
}

function extractGainWallFromExternalId(externalId: string): string {
    const match = externalId.match(/^gain-([a-z]+)-/);
    return match?.[1] ?? "";
}

function buildDiagnostics(rows: Array<Record<string, any>>) {
    const providerNames = rows.map((row) => firstRelated(row.provider)?.name).filter(Boolean);
    const minPayout = getPublicOfferMinPayout();
    return {
        missingTasks: rows.filter((row) => !Array.isArray(row.tasks) || row.tasks.length === 0).length,
        missingImages: rows.filter((row) => !row.image_url).length,
        missingUrls: rows.filter((row) => !row.offer_url).length,
        lowPayouts: rows.filter((row) => {
            const payout = Number(row.payout_usd ?? 0);
            const total = normalizeTotalPayout(payout, Number(row.total_payout_usd ?? payout));
            return payout < minPayout || total < minPayout;
        }).length,
        totalBelowPayout: rows.filter((row) => Number(row.total_payout_usd ?? row.payout_usd ?? 0) < Number(row.payout_usd ?? 0)).length,
        providerVariantGroups: Object.keys(groupProviderVariants(providerNames)).length,
    };
}

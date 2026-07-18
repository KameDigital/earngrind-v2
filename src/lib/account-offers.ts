export type SavedOfferSource = "ingested" | "manual";

export type SavedOfferInput = {
  source: SavedOfferSource;
  offerId: string;
  title: string;
  imageUrl?: string | null;
  payoutUsd?: number | null;
  platformName?: string | null;
  countryCode?: string | null;
  devices?: string[];
  offerPath: string;
};

export type SavedOfferRecord = SavedOfferInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
  trackingStartedAt?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEVICES = new Set(["ios", "android", "pc", "web", "desktop"]);
const UUID_SEGMENT = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const OFFER_PATH = /^\/offers\/[a-z0-9][a-z0-9-]*$/i;
const GO_PATH = new RegExp(`^/go/(?:${UUID_SEGMENT}|earn/${UUID_SEGMENT}|platform/${UUID_SEGMENT})$`, "i");

function shortText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function validateSavedOffer(input: unknown): { ok: true; value: SavedOfferInput } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Invalid offer." };
  const value = input as Partial<SavedOfferInput>;
  if (value.source !== "ingested" && value.source !== "manual") return { ok: false, error: "Invalid offer source." };
  const offerId = shortText(value.offerId, 36);
  if (!UUID.test(offerId)) return { ok: false, error: "Invalid offer ID." };
  const title = shortText(value.title, 160);
  if (!title) return { ok: false, error: "Offer title is required." };
  const offerPath = shortText(value.offerPath, 300);
  if (!OFFER_PATH.test(offerPath) && !GO_PATH.test(offerPath)) return { ok: false, error: "Invalid offer path." };
  const imageUrl = shortText(value.imageUrl, 500) || null;
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) return { ok: false, error: "Invalid image URL." };
  const payoutUsd = value.payoutUsd == null ? null : Number(value.payoutUsd);
  if (payoutUsd !== null && (!Number.isFinite(payoutUsd) || payoutUsd < 0 || payoutUsd > 1_000_000)) return { ok: false, error: "Invalid payout." };
  const devices = Array.isArray(value.devices) ? Array.from(new Set(value.devices.filter((item): item is string => typeof item === "string" && DEVICES.has(item)).slice(0, 5))) : [];
  return { ok: true, value: { source: value.source, offerId, title, imageUrl, payoutUsd, platformName: shortText(value.platformName, 100) || null, countryCode: shortText(value.countryCode, 8).toUpperCase() || null, devices, offerPath } };
}

export function savedOfferFromRow(row: Record<string, unknown>): SavedOfferRecord {
  return {
    id: String(row.id), source: row.offer_source === "manual" ? "manual" : "ingested", offerId: String(row.offer_id), title: String(row.title),
    imageUrl: typeof row.image_url === "string" ? row.image_url : null, payoutUsd: typeof row.payout_usd === "number" ? row.payout_usd : row.payout_usd == null ? null : Number(row.payout_usd),
    platformName: typeof row.platform_name === "string" ? row.platform_name : null, countryCode: typeof row.country_code === "string" ? row.country_code : null,
    devices: Array.isArray(row.devices) ? row.devices.filter((item): item is string => typeof item === "string") : [], offerPath: String(row.offer_path), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
    lastViewedAt: typeof row.last_viewed_at === "string" ? row.last_viewed_at : undefined, trackingStartedAt: typeof row.tracking_started_at === "string" ? row.tracking_started_at : undefined,
  };
}

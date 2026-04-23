export interface PlatformRecord {
    id: string;
    name: string;
    slug: string;
    platform_kind: string | null;
    logo_url: string | null;
    affiliate_template: string | null;
    description: string | null;
    countries: string[] | null;
    is_active: boolean | null;
}

export interface GameRecord {
    id: string;
    name: string;
    slug: string;
    aliases: string[] | null;
    category: string | null;
    devices: string[] | null;
    thumbnail_url: string | null;
    description: string | null;
}

export interface OfferRecord {
    id: string;
    platform_id: string;
    game_id: string | null;
    external_id: string;
    title: string;
    payout_usd: number;
    payout_type: "online_cashback" | "gift_card" | "points" | "crypto";
    devices: string[];
    countries: string[];
    category: string;
    custom_param: string;
    offer_expires_at: string | null;
    status: string;
    is_featured: boolean | null;
    is_boosted: boolean | null;
    updated_at: string;
}

export interface OfferHistoryRecord {
    id: string;
    offer_id: string;
    payout_usd: number;
    recorded_at: string;
    source: string;
}

export interface ProviderRecord {
    id: string;
    name: string;
    slug: string;
    is_active: boolean | null;
}

export interface SiteOfferRecord {
    id: string;
    site_id: string;
    provider_id: string;
    game_id: string | null;
    external_id: string;
    title: string;
    payout_usd: number;
    total_payout_usd: number | null;
    goal_text: string | null;
    offer_url: string | null;
    image_url: string | null;
    devices: string[] | null;
    countries: string[] | null;
    status: string;
    updated_at: string;
}

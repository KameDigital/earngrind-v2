import { SourceOffer } from "../types/offer";

export type SourceType = "html" | "api";

export interface SourceRecord {
    id: string;
    name: string;
    type: SourceType;
    base_url: string;
    active: boolean;
    last_run_at: string | null;
}

export interface ImportRunRecord {
    id: string;
    source_id: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    total_found: number;
    total_new: number;
    total_updated: number;
}

export interface SourceAdapter {
    key: string;
    name: string;
    type: SourceType;
    baseUrl: string;
    fetchOffers: () => Promise<SourceOffer[]>;
    storage?: "offers" | "site_offers";
    mockEnvVar?: string;
}

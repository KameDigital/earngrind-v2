import { RawOffer } from "../types";

export interface SourceOffer extends RawOffer {}

export interface ImportStats {
    found: number;
    normalized: number;
    matched: number;
    created: number;
    updated: number;
    inactivated: number;
    skipped: number;
    failed: number;
}

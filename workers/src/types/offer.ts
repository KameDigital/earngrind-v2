import { RawOffer } from "../types";

export interface SourceOffer extends RawOffer {}

export interface ImportStats {
    found: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
}

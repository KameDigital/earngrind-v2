const DEFAULT_GA_MEASUREMENT_ID = "G-P1HPXTXTMW";

export function getGaMeasurementId(): string {
    return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_MEASUREMENT_ID;
}

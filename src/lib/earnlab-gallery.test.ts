import {
    getEarnLabCountryName,
    normalizeEarnLabCountryCode,
} from "./earnlab-countries";

function assert(condition: unknown, message: string): void {
    if (!condition) throw new Error(message);
}

export function runEarnLabGalleryValidationTests(): void {
    assert(normalizeEarnLabCountryCode("us") === "US", "normalizes lowercase country codes");
    assert(normalizeEarnLabCountryCode(" GB ") === "GB", "trims country codes");
    assert(normalizeEarnLabCountryCode("USA") === null, "rejects three-letter country codes");
    assert(normalizeEarnLabCountryCode("1!") === null, "rejects malformed country codes");
    assert(getEarnLabCountryName("US") === "United States", "maps known country names");
}

runEarnLabGalleryValidationTests();

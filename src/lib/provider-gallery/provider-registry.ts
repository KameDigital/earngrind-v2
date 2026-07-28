import type { ProviderGalleryConfig } from "./types";
import { slugifyGalleryValue } from "./normalize";
import { EARNLAB_GALLERY_COUNTRIES } from "@/lib/earnlab-countries";

export const PROVIDER_GALLERY_REGISTRY = {
    earnlab: {
        key: "earnlab",
        platformSlug: "earnlab",
        platformName: "EarnLab",
        platformKind: "gpt_site",
        affiliateTemplate: "https://earnlab.com/r/mac",
        supportedCountries: [...EARNLAB_GALLERY_COUNTRIES],
        maxImportLimit: 75,
        defaultSort: "POPULARITY",
        hasDirectOfferDeeplinks: false,
        preserveExistingOfferUrlOnMissingDeeplink: true,
        externalIdStrategy: (offer) => `${offer.sourceOfferId}-${offer.countryCode}`,
        genericFallbackUrl: "https://earnlab.com/tasks",
    },
    gemsloot: {
        key: "gemsloot",
        platformSlug: "gemsloot",
        platformName: "Gemsloot",
        platformKind: "gpt_site",
        affiliateTemplate: "https://gemsloot.com/?aff=kamedev",
        supportedCountries: ["US", "GB"],
        maxImportLimit: 300,
        defaultSort: "epc",
        hasDirectOfferDeeplinks: true,
        preserveExistingOfferUrlOnMissingDeeplink: true,
        externalIdStrategy: (offer) => `gemsloot-${slugifyGalleryValue(offer.providerDisplayName)}-${offer.sourceOfferId}`,
        genericFallbackUrl: "https://gemsloot.com/earn",
    },
    "gain-gg": {
        key: "gain-gg",
        platformSlug: "gain-gg",
        platformName: "Gain.gg",
        platformKind: "gpt_site",
        affiliateTemplate: "https://gain.gg/r/macko",
        maxImportLimit: 300,
        defaultSort: "native",
        hasDirectOfferDeeplinks: true,
        preserveExistingOfferUrlOnMissingDeeplink: true,
        externalIdStrategy: (offer) => {
            const wall = typeof offer.rawMetadata?.wall === "string" ? offer.rawMetadata.wall : offer.sourceProviderSlug;
            return `gain-${slugifyGalleryValue(wall)}-${offer.sourceOfferId}-${offer.countryCode}`;
        },
        genericFallbackUrl: "https://gain.gg/r/macko",
    },
    cashinstyle: {
        key: "cashinstyle",
        platformSlug: "cashinstyle",
        platformName: "CashInStyle",
        platformKind: "gpt_site",
        affiliateTemplate: "https://cashinstyle.com/?ref=earngrind",
        maxImportLimit: 300,
        hasDirectOfferDeeplinks: true,
        preserveExistingOfferUrlOnMissingDeeplink: true,
        externalIdStrategy: "platform-provider-source-country",
        genericFallbackUrl: "https://cashinstyle.com/?ref=earngrind",
    },
    earninstyle: {
        key: "earninstyle",
        platformSlug: "earninstyle",
        platformName: "EarnInStyle",
        platformKind: "gpt_site",
        affiliateTemplate: "https://earninstyle.com/",
        maxImportLimit: 300,
        hasDirectOfferDeeplinks: true,
        preserveExistingOfferUrlOnMissingDeeplink: true,
        externalIdStrategy: "platform-provider-source-country",
        genericFallbackUrl: "https://earninstyle.com/",
    },
} satisfies Record<string, ProviderGalleryConfig>;

export type ProviderGalleryKey = keyof typeof PROVIDER_GALLERY_REGISTRY;

export function getProviderGalleryConfig(key: ProviderGalleryKey): ProviderGalleryConfig {
    return PROVIDER_GALLERY_REGISTRY[key];
}

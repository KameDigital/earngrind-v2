export const GEMSLOOT_PUBLIC_PROVIDERS = [
  { slug: "gemsloot", label: "Gemsloot" },
  { slug: "torox", label: "ToroX" },
  { slug: "revu", label: "Revenue Universe" },
  { slug: "bitlabs", label: "BitLabs" },
  { slug: "tyrads", label: "TyrAds" },
  { slug: "adscendmedia", label: "AdscendMedia" },
  { slug: "hangmyads", label: "HangMyAds" },
] as const;

export type GemslootProviderSlug = typeof GEMSLOOT_PUBLIC_PROVIDERS[number]["slug"];

export type EarnGrindContentType =
    | "game_guide"
    | "offer_guide"
    | "gpt_comparison"
    | "platform_review"
    | "blog_post";

export const PUBLIC_GUIDE_TYPES = [
    "game_offer",
    "payout_guide",
    "how_to_earn",
    "beginner_guide",
] as const;

const GPT_COMPARISON_PATTERNS = [
    /\bbest\s+gpt\b/i,
    /\bhighest[\s-]+paying\s+gpt\b/i,
    /\bgpt\s+site/i,
    /\bgpt\s+sites/i,
];

const PLATFORM_REVIEW_PATTERNS = [
    /\breview\b/i,
    /\bfreecash\b/i,
    /\bswagbucks\b/i,
    /\bearnlab\b/i,
    /\bgain\.?gg\b/i,
    /\bkashkick\b/i,
    /\binboxdollars\b/i,
    /\bmypoints\b/i,
    /\bprizerebel\b/i,
    /\bscrambly\b/i,
    /\bysense\b/i,
    /\bfanduel\s+casino\b/i,
];

export function isPublicGuideType(guideType: string | null | undefined) {
    if (!guideType) return true;
    return PUBLIC_GUIDE_TYPES.includes(guideType as typeof PUBLIC_GUIDE_TYPES[number]);
}

export function inferStaticGuideContentType(title: string): EarnGrindContentType {
    if (GPT_COMPARISON_PATTERNS.some((pattern) => pattern.test(title))) return "gpt_comparison";
    if (PLATFORM_REVIEW_PATTERNS.some((pattern) => pattern.test(title))) return "platform_review";
    return "offer_guide";
}

export function shouldShowOnGameGuidesIndex({
    title,
    guideType,
}: {
    title: string;
    guideType?: string | null;
}) {
    if (!isPublicGuideType(guideType)) return false;
    if (guideType) return true;
    if (GPT_COMPARISON_PATTERNS.some((pattern) => pattern.test(title))) return false;
    if (PLATFORM_REVIEW_PATTERNS.some((pattern) => pattern.test(title))) return false;
    return true;
}

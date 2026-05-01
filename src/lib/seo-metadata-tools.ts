export type SeoMetadataAnalysis = {
    score: number;
    length: number;
    warnings: string[];
    strengths: string[];
};

export type SeoVariantInput = {
    guideTitle: string;
    keywordTarget?: string | null;
    currentTitle?: string | null;
    currentDescription?: string | null;
    maxPayoutUsd?: number | null;
    year?: number;
};

const POWER_WORDS = [
    "best",
    "fastest",
    "guide",
    "strategy",
    "worth",
    "compare",
    "payout",
    "offer",
    "complete",
    "tips",
];

const GENERIC_TITLES = [
    "guide",
    "offer guide",
    "game guide",
    "review",
    "best offer",
    "how to earn",
];

function includesKeyword(value: string, keywordTarget?: string | null) {
    const keyword = keywordTarget?.trim().toLowerCase();
    if (!keyword) return true;
    return value.toLowerCase().includes(keyword);
}

function hasPowerWord(value: string) {
    const lower = value.toLowerCase();
    return POWER_WORDS.some((word) => lower.includes(word));
}

function hasYear(value: string) {
    return /\b20\d{2}\b/.test(value);
}

function isTooGeneric(value: string) {
    const normalized = value.trim().toLowerCase();
    return normalized.split(/\s+/).length <= 3 || GENERIC_TITLES.includes(normalized);
}

function unique(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function analyzeSeoTitle(title: string, keywordTarget?: string | null, duplicateTitles: string[] = []): SeoMetadataAnalysis {
    const value = title.trim();
    const warnings: string[] = [];
    const strengths: string[] = [];
    let score = 100;

    if (!value) {
        return { score: 0, length: 0, warnings: ["SEO title is missing."], strengths: [] };
    }

    if (value.length < 40) {
        score -= 18;
        warnings.push("Title is short; add a clearer benefit or intent modifier.");
    } else if (value.length > 70) {
        score -= 18;
        warnings.push("Title may truncate in search results.");
    } else {
        strengths.push("Title length is in a strong range.");
    }

    if (!includesKeyword(value, keywordTarget)) {
        score -= 20;
        warnings.push("Keyword target is not included.");
    } else if (keywordTarget?.trim()) {
        strengths.push("Keyword target is included.");
    }

    if (!hasPowerWord(value)) {
        score -= 10;
        warnings.push("Title could use a clearer benefit word like guide, strategy, best, payout, or compare.");
    } else {
        strengths.push("Title includes a useful intent or benefit word.");
    }

    if (!hasYear(value)) {
        score -= 5;
        warnings.push("Consider adding the current year when freshness matters.");
    }

    if (isTooGeneric(value)) {
        score -= 20;
        warnings.push("Title is too generic for competitive search intent.");
    }

    const duplicate = duplicateTitles.some((candidate) => candidate.trim().toLowerCase() === value.toLowerCase());
    if (duplicate) {
        score -= 20;
        warnings.push("Duplicate title risk detected against another guide.");
    }

    return { score: Math.max(0, score), length: value.length, warnings, strengths };
}

export function analyzeSeoDescription(description: string, keywordTarget?: string | null): SeoMetadataAnalysis {
    const value = description.trim();
    const warnings: string[] = [];
    const strengths: string[] = [];
    let score = 100;

    if (!value) {
        return { score: 0, length: 0, warnings: ["SEO description is missing."], strengths: [] };
    }

    if (value.length < 120) {
        score -= 18;
        warnings.push("Description is short; explain what the reader gets before clicking.");
    } else if (value.length > 165) {
        score -= 18;
        warnings.push("Description may truncate in search results.");
    } else {
        strengths.push("Description length is in a strong range.");
    }

    if (!includesKeyword(value, keywordTarget)) {
        score -= 15;
        warnings.push("Keyword target is not included.");
    } else if (keywordTarget?.trim()) {
        strengths.push("Keyword target is included.");
    }

    if (!/compare|learn|check|guide|strategy|requirements|payout|before starting/i.test(value)) {
        score -= 12;
        warnings.push("Description needs a clearer search benefit or next-step reason.");
    }

    if (!/change|verify|before starting|requirements|terms|current|live/i.test(value)) {
        score -= 6;
        warnings.push("Consider adding cautious freshness language for payouts or requirements.");
    }

    if (isTooGeneric(value)) {
        score -= 20;
        warnings.push("Description is too generic.");
    }

    return { score: Math.max(0, score), length: value.length, warnings, strengths };
}

export function generateSeoTitleVariants(input: SeoVariantInput) {
    const year = input.year ?? new Date().getFullYear();
    const keyword = input.keywordTarget?.trim() || input.guideTitle.trim();
    const payout = input.maxPayoutUsd ? ` Up to $${input.maxPayoutUsd.toFixed(2)}` : "";

    return unique([
        `${keyword}: Fastest Completion Strategy (${year})`,
        `${keyword} Guide: Requirements, Payouts, and Tips (${year})`,
        `${keyword}: Best Route Before You Start (${year})`,
        `${keyword} Offer Guide${payout ? `:${payout}` : ""} (${year})`,
        `Is ${keyword} Worth It? Payout and Strategy Guide (${year})`,
        `${keyword}: Compare Payouts and Avoid Common Mistakes`,
    ]).slice(0, 6);
}

export function generateSeoDescriptionVariants(input: SeoVariantInput) {
    const keyword = input.keywordTarget?.trim() || input.guideTitle.trim();
    const payout = input.maxPayoutUsd ? `, including routes up to $${input.maxPayoutUsd.toFixed(2)}` : "";

    return unique([
        `Compare ${keyword} requirements, payouts${payout}, and completion tips before starting. Learn the fastest milestones, common mistakes, and ROI warnings.`,
        `Use this ${keyword} guide to review payout value, task difficulty, tracking risks, and the best route to check before starting the offer.`,
        `See what ${keyword} requires, where users may get stuck, and how to compare live payouts before committing time or money.`,
        `Review ${keyword} milestones, strategy notes, and payout considerations so you can decide whether the live offer is worth starting.`,
        `Check ${keyword} offer requirements, completion strategy, and payout warnings before clicking into a GPT platform. Offers can change, so verify live terms first.`,
    ]).slice(0, 5);
}

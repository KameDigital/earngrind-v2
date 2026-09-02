const KNOWN_BOT_PATTERNS: RegExp[] = [
    /meta-externalagent/i,
    /claudebot/i,
    /gptbot/i,
    /perplexitybot/i,
    /bytespider/i,
    /applebot/i,
    /googlebot/i,
    /bingbot/i,
    /facebookexternalhit/i,
    /brightbot/i,
    /serankingbacklinksbot/i,
    /ahrefsbot/i,
    /semrushbot/i,
    /yandexbot/i,
    /duckduckbot/i,
    /slurp/i,
    /\bbot\b/i,
    /crawler/i,
    /spider/i,
    /\bcurl\b/i,
    /python-requests/i,
    /okhttp/i,
    /\bscrapy\b/i,
    /\bwget\b/i,
    /postmanruntime/i,
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
    if (!userAgent || typeof userAgent !== "string") {
        return false;
    }

    const ua = userAgent.trim();
    if (!ua) return false;

    return KNOWN_BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

import "server-only";

export type CpaleadReadiness = {
    enabled: boolean;
    missing: string[];
};

export function getCpaleadReadiness(): CpaleadReadiness {
    const enabled = process.env.NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED === "true";
    const wallBaseUrl = process.env.CPALEAD_WALL_BASE_URL?.trim();
    const missing = [
        process.env.CPALEAD_PUBLISHER_ID?.trim() ? null : "CPALEAD_PUBLISHER_ID",
        wallBaseUrl && isHttpUrl(wallBaseUrl) ? null : "CPALEAD_WALL_BASE_URL",
        process.env.CPALEAD_WALL_ID?.trim() ? null : "CPALEAD_WALL_ID",
        process.env.POSTBACK_PROVIDER_CPALEAD_SECRET?.trim() ? null : "POSTBACK_PROVIDER_CPALEAD_SECRET",
    ].filter(Boolean) as string[];

    return {
        enabled,
        missing,
    };
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

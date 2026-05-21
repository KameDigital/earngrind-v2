import "server-only";

export type CpaleadWallEnv = {
    publisherId: string | null;
    wallBaseUrl: string | null;
    wallId: string | null;
    postbackSecretConfigured: boolean;
    missing: string[];
};

export function getCpaleadWallEnv(): CpaleadWallEnv {
    const publisherId = process.env.CPALEAD_PUBLISHER_ID?.trim() || null;
    const wallBaseUrl = process.env.CPALEAD_WALL_BASE_URL?.trim() || null;
    const wallId = process.env.CPALEAD_WALL_ID?.trim() || null;
    const postbackSecretConfigured = Boolean(process.env.POSTBACK_PROVIDER_CPALEAD_SECRET?.trim());
    const wallBaseUrlReady = Boolean(wallBaseUrl && isHttpUrl(wallBaseUrl));
    const missing = [
        publisherId ? null : "CPALEAD_PUBLISHER_ID",
        wallBaseUrlReady ? null : "CPALEAD_WALL_BASE_URL",
        wallId ? null : "CPALEAD_WALL_ID",
        postbackSecretConfigured ? null : "POSTBACK_PROVIDER_CPALEAD_SECRET",
    ].filter(Boolean) as string[];

    return {
        publisherId,
        wallBaseUrl,
        wallId,
        postbackSecretConfigured,
        missing,
    };
}

export function buildCpaleadWallUrl(wallBaseUrl: string, wallId: string, clickId: string): string {
    const url = new URL(wallBaseUrl);
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    const encodedWallId = encodeURIComponent(wallId);

    if (normalizedPath.endsWith(`/wall/${encodedWallId}`)) {
        url.pathname = normalizedPath;
    } else if (normalizedPath.endsWith("/wall")) {
        url.pathname = `${normalizedPath}/${encodedWallId}`;
    } else {
        url.pathname = `${normalizedPath}/wall/${encodedWallId}`;
    }

    url.searchParams.set("subid", clickId);
    return url.toString();
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

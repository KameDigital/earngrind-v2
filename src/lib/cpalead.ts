import "server-only";

export type CpaleadWallEnv = {
    publisherId: string | null;
    wallId: string | null;
    postbackSecretConfigured: boolean;
    missing: string[];
};

export function getCpaleadWallEnv(): CpaleadWallEnv {
    const publisherId = process.env.CPALEAD_PUBLISHER_ID?.trim() || null;
    const wallId = process.env.CPALEAD_WALL_ID?.trim() || null;
    const postbackSecretConfigured = Boolean(process.env.POSTBACK_PROVIDER_CPALEAD_SECRET?.trim());
    const missing = [
        publisherId ? null : "CPALEAD_PUBLISHER_ID",
        wallId ? null : "CPALEAD_WALL_ID",
        postbackSecretConfigured ? null : "POSTBACK_PROVIDER_CPALEAD_SECRET",
    ].filter(Boolean) as string[];

    return {
        publisherId,
        wallId,
        postbackSecretConfigured,
        missing,
    };
}

export function buildCpaleadWallUrl(wallId: string, clickId: string): string {
    const url = new URL(`https://www.cpalead.com/wall/${encodeURIComponent(wallId)}`);
    url.searchParams.set("subid", clickId);
    return url.toString();
}

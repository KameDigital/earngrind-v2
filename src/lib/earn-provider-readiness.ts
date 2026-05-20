import "server-only";

export type CpaleadReadiness = {
    enabled: boolean;
    missing: string[];
};

export function getCpaleadReadiness(): CpaleadReadiness {
    const enabled = process.env.NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED === "true";
    const missing = [
        process.env.CPALEAD_PUBLISHER_ID?.trim() ? null : "CPALEAD_PUBLISHER_ID",
        process.env.CPALEAD_WALL_ID?.trim() ? null : "CPALEAD_WALL_ID",
        process.env.POSTBACK_PROVIDER_CPALEAD_SECRET?.trim() ? null : "POSTBACK_PROVIDER_CPALEAD_SECRET",
    ].filter(Boolean) as string[];

    return {
        enabled,
        missing,
    };
}

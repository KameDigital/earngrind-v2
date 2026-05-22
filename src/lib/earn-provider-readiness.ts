import "server-only";

export type CpaleadReadiness = {
    enabled: boolean;
    publicEnabled: boolean;
    privateBetaEnabled: boolean;
    privateBetaAllowed: boolean;
    privateBetaEmailCount: number;
    accessMode: "public" | "private" | "disabled";
    missing: string[];
};

export function getCpaleadReadiness(userEmail?: string | null): CpaleadReadiness {
    const publicEnabled = process.env.NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED === "true";
    const privateBetaEnabled = process.env.EARN_REWARDS_PRIVATE_BETA_ENABLED === "true";
    const privateBetaEmails = getPrivateBetaEmails();
    const privateBetaAllowed = Boolean(privateBetaEnabled && userEmail && privateBetaEmails.has(normalizeEmail(userEmail)));
    const accessMode = publicEnabled ? "public" : privateBetaAllowed ? "private" : "disabled";
    const wallBaseUrl = process.env.CPALEAD_WALL_BASE_URL?.trim();
    const missing = [
        process.env.CPALEAD_PUBLISHER_ID?.trim() ? null : "CPALEAD_PUBLISHER_ID",
        wallBaseUrl && isHttpUrl(wallBaseUrl) ? null : "CPALEAD_WALL_BASE_URL",
        process.env.CPALEAD_WALL_ID?.trim() ? null : "CPALEAD_WALL_ID",
    ].filter(Boolean) as string[];

    return {
        enabled: accessMode !== "disabled",
        publicEnabled,
        privateBetaEnabled,
        privateBetaAllowed,
        privateBetaEmailCount: privateBetaEmails.size,
        accessMode,
        missing,
    };
}

function getPrivateBetaEmails(): Set<string> {
    return new Set(
        (process.env.EARN_REWARDS_PRIVATE_BETA_EMAILS ?? "")
            .split(",")
            .map((email) => normalizeEmail(email))
            .filter(Boolean),
    );
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

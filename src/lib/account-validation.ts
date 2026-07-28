import { getPublicOfferCountryByCode } from "@/lib/earnlab-countries";

export const PREFERRED_DEVICES = ["all", "android", "ios", "desktop"] as const;
export type PreferredDevice = typeof PREFERRED_DEVICES[number];

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

export function getSafeReturnPath(value: FormDataEntryValue | string | null | undefined): string {
    const path = typeof value === "string" ? value.trim() : "";
    return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/account";
}

export function validateCredentials(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false as const, error: "Enter a valid email address." };
    if (password.length < 8) return { ok: false as const, error: "Password must be at least 8 characters." };
    return { ok: true as const, value: { email, password } };
}

export function validateProfileInput(formData: FormData) {
    const rawUsername = String(formData.get("username") ?? "").trim().toLowerCase();
    const username = rawUsername || null;
    const displayName = String(formData.get("display_name") ?? "").trim() || null;
    const avatarUrl = String(formData.get("avatar_url") ?? "").trim() || null;
    const country = getPublicOfferCountryByCode(String(formData.get("country_code") ?? ""));
    const preferredDevice = String(formData.get("preferred_device") ?? "");

    if (username && !USERNAME_PATTERN.test(username)) return { ok: false as const, error: "Username must be 3-30 lowercase letters, numbers, underscores, or hyphens." };
    if (displayName && displayName.length > 80) return { ok: false as const, error: "Display name must be 80 characters or fewer." };
    if (avatarUrl) {
        try {
            const url = new URL(avatarUrl);
            if (url.protocol !== "https:") throw new Error("invalid protocol");
        } catch {
            return { ok: false as const, error: "Avatar URL must be a valid HTTPS URL." };
        }
    }
    if (!country) return { ok: false as const, error: "Choose a supported offer country." };
    if (!PREFERRED_DEVICES.includes(preferredDevice as PreferredDevice)) return { ok: false as const, error: "Choose a supported device preference." };

    return { ok: true as const, value: { username, display_name: displayName, avatar_url: avatarUrl, country_code: country.code, preferred_device: preferredDevice as PreferredDevice } };
}

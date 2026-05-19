import { createHmac, timingSafeEqual } from "crypto";
import type { PostbackSources, ProviderConfig, SignatureAlgorithm, SignatureLocation } from "./types";

function getSourceValue(sources: PostbackSources, location: SignatureLocation, param: string): string | null {
    const source = location === "header" ? sources.headers : sources[location];
    const value = source[param] ?? source[param.toLowerCase()];
    return typeof value === "string" && value.length > 0 ? value : null;
}

function safeCompare(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
}

function nodeAlgorithm(algorithm: SignatureAlgorithm): string | null {
    if (algorithm === "hmac-sha1") return "sha1";
    if (algorithm === "hmac-sha256") return "sha256";
    if (algorithm === "hmac-sha512") return "sha512";
    return null;
}

function normalizeSignature(value: string): string {
    return value.replace(/^sha(?:1|256|512)=/i, "").trim().toLowerCase();
}

function canonicalPayload(rawBody: string, sources: PostbackSources, signatureParam: string): string {
    if (rawBody.trim()) return rawBody;

    const pairs = [
        ...Object.entries(sources.query),
        ...Object.entries(sources.body),
    ].filter(([key, value]) => key !== signatureParam && typeof value !== "undefined" && value !== null);

    return pairs
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&");
}

export function validatePostbackSignature({
    config,
    sources,
    rawBody,
}: {
    config: ProviderConfig;
    sources: PostbackSources;
    rawBody: string;
}): { ok: boolean; reason?: string } {
    if (config.secret_type === "none" && config.signature_algorithm === "none") return { ok: true };

    const signatureParam = config.signature_param;
    if (!signatureParam) return { ok: false, reason: "signature_param_missing" };

    const provided = getSourceValue(sources, config.signature_location, signatureParam);
    if (!provided) return { ok: false, reason: "signature_missing" };

    const secret = config.secret;
    if (!secret) return { ok: false, reason: "secret_missing" };

    if (config.secret_type === "static_token") {
        return safeCompare(provided, secret)
            ? { ok: true }
            : { ok: false, reason: "invalid_token" };
    }

    if (config.secret_type !== "hmac") return { ok: false, reason: "unsupported_secret_type" };

    const algorithm = nodeAlgorithm(config.signature_algorithm);
    if (!algorithm) return { ok: false, reason: "unsupported_signature_algorithm" };

    const payload = canonicalPayload(rawBody, sources, signatureParam);
    const expected = createHmac(algorithm, secret).update(payload).digest("hex");
    return safeCompare(normalizeSignature(provided), expected)
        ? { ok: true }
        : { ok: false, reason: "invalid_signature" };
}

export function getProvidedSignature(config: ProviderConfig, sources: PostbackSources): string | null {
    return config.signature_param ? getSourceValue(sources, config.signature_location, config.signature_param) : null;
}

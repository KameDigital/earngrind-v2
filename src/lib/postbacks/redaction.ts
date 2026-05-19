import type { PostbackSources } from "./types";

const ALWAYS_REDACT = [
    "secret",
    "token",
    "signature",
    "sig",
    "password",
    "authorization",
    "cookie",
    "set-cookie",
    "email",
    "device_id",
    "advertising_id",
];

function shouldRedact(key: string, fields: Set<string>): boolean {
    return fields.has(key.toLowerCase());
}

function redactValue(value: unknown, fields: Set<string>): unknown {
    if (Array.isArray(value)) return value.map((item) => redactValue(item, fields));

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
                key,
                shouldRedact(key, fields) ? "[redacted]" : redactValue(entryValue, fields),
            ]),
        );
    }

    return value;
}

export function redactionFields(configuredFields: string[] | null | undefined): Set<string> {
    return new Set(
        [...ALWAYS_REDACT, ...(configuredFields ?? [])]
            .map((field) => field.trim().toLowerCase())
            .filter(Boolean),
    );
}

export function redactPostbackSources(
    sources: PostbackSources,
    configuredFields: string[] | null | undefined,
): Record<string, unknown> {
    const fields = redactionFields(configuredFields);
    return {
        query: redactValue(sources.query, fields),
        body: redactValue(sources.body, fields),
        headers: redactValue(sources.headers, fields),
    };
}

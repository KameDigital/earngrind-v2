import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export function loadEnvFiles(paths = ["workers/.env", ".env.local"]) {
    for (const path of paths) {
        try {
            for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
                const line = rawLine.trim();
                if (!line || line.startsWith("#") || !line.includes("=")) continue;
                const index = line.indexOf("=");
                const key = line.slice(0, index).trim();
                const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
                if (key && process.env[key] === undefined) process.env[key] = value;
            }
        } catch {
            // Optional env file.
        }
    }
}

export function parseArgs(argv = process.argv.slice(2)) {
    const args = { _: [] };
    for (let index = 0; index < argv.length; index += 1) {
        const item = argv[index];
        if (!item.startsWith("--")) {
            args._.push(item);
            continue;
        }
        const [rawKey, inlineValue] = item.slice(2).split("=", 2);
        const key = rawKey.trim();
        const next = argv[index + 1];
        if (inlineValue !== undefined) {
            args[key] = inlineValue;
        } else if (next && !next.startsWith("--")) {
            args[key] = next;
            index += 1;
        } else {
            args[key] = true;
        }
    }
    return args;
}

export async function fetchAll(db, table, select, mutate = (query) => query, pageSize = 1000) {
    const rows = [];
    for (let from = 0; ; from += pageSize) {
        let query = db.from(table).select(select).range(from, from + pageSize - 1);
        query = mutate(query);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        rows.push(...(data ?? []));
        if (!data || data.length < pageSize) break;
    }
    return rows;
}

export function firstRelated(value) {
    return Array.isArray(value) ? value[0] ?? null : value;
}

const PROVIDER_DISPLAY_NAMES = {
    "adscend media": "AdscendMedia",
    adscendmedia: "AdscendMedia",
    "ayet studios": "AyetStudios",
    ayetstudios: "AyetStudios",
    "earn lab": "EarnLab",
    earnlab: "EarnLab",
    offertoro: "Torox",
    revu: "RevU",
    "revenue universe": "RevU",
    torox: "Torox",
    toroxio: "Torox",
};

export function normalizeProviderDisplayName(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "Unknown Provider";
    const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
    const compactKey = key.replace(/\s+/g, "");
    return PROVIDER_DISPLAY_NAMES[key] ?? PROVIDER_DISPLAY_NAMES[compactKey] ?? raw;
}

export function providerDisplayKey(value) {
    return normalizeProviderDisplayName(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function groupProviderVariants(values) {
    const groups = new Map();
    for (const value of values) {
        const raw = String(value ?? "").trim();
        if (!raw) continue;
        const canonical = normalizeProviderDisplayName(raw);
        const set = groups.get(canonical) ?? new Set();
        set.add(raw);
        groups.set(canonical, set);
    }
    return Object.fromEntries(
        Array.from(groups.entries())
            .filter(([, variants]) => variants.size > 1)
            .map(([canonical, variants]) => [canonical, Array.from(variants).sort()]),
    );
}

export function increment(record, key, amount = 1) {
    record[key] = (record[key] ?? 0) + amount;
}

export function toNumber(value, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(String(value ?? "").replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeTotalPayout(payoutUsd, totalPayoutUsd) {
    const payout = toNumber(payoutUsd);
    const total = toNumber(totalPayoutUsd, payout);
    return total < payout ? payout : total;
}

export function isLowPayout(row, threshold) {
    const payout = toNumber(row.payout_usd);
    const total = normalizeTotalPayout(payout, row.total_payout_usd);
    return payout < threshold || total < threshold;
}

export function toDbTaskType(value) {
    return ["install", "milestone", "purchase", "signup", "other"].includes(value) ? value : "other";
}

export function inferFallbackTaskType(text) {
    const value = String(text ?? "").toLowerCase();
    if (/\bpurchase|buy|deposit|spend|recharge|pack\b/.test(value)) return "purchase";
    if (/\bsign ?up|signup|register|account|join\b/.test(value)) return "signup";
    if (/\breach|complete|level|chapter|stage|mission|milestone|board|village|task\b/.test(value)) return "milestone";
    if (/\binstall|download|open|start|play|launch\b/.test(value)) return "install";
    return "other";
}

export function buildFallbackTaskTitle(title, goalText) {
    const text = String(goalText || title || "Complete offer").replace(/\s+/g, " ").trim();
    return text.length <= 120 ? text : `${text.slice(0, 117).trim()}...`;
}

export function cleanImageUrl(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
    if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
    return null;
}

export function writeJsonReport(path, payload) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function writeCsvReport(path, rows) {
    mkdirSync(dirname(path), { recursive: true });
    if (!rows.length) {
        writeFileSync(path, "\n", "utf8");
        return;
    }
    const headers = Array.from(rows.reduce((set, row) => {
        Object.keys(flattenForCsv(row)).forEach((key) => set.add(key));
        return set;
    }, new Set()));
    const lines = [
        headers.join(","),
        ...rows.map((row) => {
            const flat = flattenForCsv(row);
            return headers.map((header) => csvCell(flat[header])).join(",");
        }),
    ];
    writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

function flattenForCsv(row, prefix = "") {
    const flat = {};
    for (const [key, value] of Object.entries(row ?? {})) {
        const nextKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            Object.assign(flat, flattenForCsv(value, nextKey));
        } else if (Array.isArray(value)) {
            flat[nextKey] = value.join("|");
        } else {
            flat[nextKey] = value;
        }
    }
    return flat;
}

function csvCell(value) {
    const text = String(value ?? "");
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

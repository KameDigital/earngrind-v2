import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const ts = require("typescript");

loadEnvFile(".env.local");
loadEnvFile(".env.production");

const {
    GPT_AFFILIATE_PLATFORMS,
    buildTrackedPlatformHref,
} = loadTypescriptModule("src/lib/gpt-affiliate-platforms.ts");
const {
    buildPlatformAffiliateUrl,
} = loadTypescriptModule("src/lib/outbound.ts");

assert.ok(Array.isArray(GPT_AFFILIATE_PLATFORMS), "GPT_AFFILIATE_PLATFORMS exports an array");
assert.ok(GPT_AFFILIATE_PLATFORMS.length > 0, "GPT_AFFILIATE_PLATFORMS is not empty");

for (const platform of GPT_AFFILIATE_PLATFORMS) {
    const href = buildTrackedPlatformHref(platform, "affiliate_route_validation");
    assert.match(href, new RegExp(`^/go/platform/${escapeRegExp(platform.slug)}\\?`), `${platform.slug} CTA uses /go/platform slug route`);
    assert.ok(href.includes("source_context=best_gpt_sites_monetization"), `${platform.slug} CTA keeps monetization source context`);
    assert.ok(href.includes("click_location=affiliate_route_validation"), `${platform.slug} CTA keeps click location attribution`);
}

const db = createClientFromEnv();
const slugs = GPT_AFFILIATE_PLATFORMS.map((platform) => platform.slug);
const { data: rows, error } = await db
    .from("platforms")
    .select("id, name, slug, affiliate_template, is_active")
    .in("slug", slugs);

if (error) throw error;

const rowsBySlug = new Map((rows ?? []).map((row) => [row.slug, row]));
const missing = slugs.filter((slug) => !rowsBySlug.has(slug));
assert.equal(missing.length, 0, `Missing platform rows for ${missing.join(", ")}`);

const codeOnlyReferralSlugs = new Set(["scrambly"]);
for (const platform of GPT_AFFILIATE_PLATFORMS) {
    const row = rowsBySlug.get(platform.slug);
    assert.equal(row.is_active, true, `${platform.slug} platform row is active`);

    const outboundUrl = buildPlatformAffiliateUrl({ platform: row });
    assert.ok(outboundUrl, `${platform.slug} resolves an outbound URL`);

    if (codeOnlyReferralSlugs.has(platform.slug)) {
        assert.match(platform.disclosure ?? "", /referral code/i, `${platform.slug} discloses its referral code`);
        continue;
    }

    assert.match(
        outboundUrl,
        /(ref=|rb=|r_|\/r\/|aff=|\?r=)/i,
        `${platform.slug} outbound URL includes an affiliate/referral marker`,
    );
}

console.log(`GPT platform affiliate route validation passed (${GPT_AFFILIATE_PLATFORMS.length} platforms)`);

function loadTypescriptModule(path) {
    const sourcePath = resolve(process.cwd(), path);
    const source = readFileSync(sourcePath, "utf8");
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            esModuleInterop: true,
        },
    }).outputText;

    const sandbox = {
        exports: {},
        module: { exports: {} },
        URL,
        URLSearchParams,
        encodeURIComponent,
    };
    sandbox.exports = sandbox.module.exports;
    vm.runInNewContext(compiled, sandbox, { filename: sourcePath });
    return sandbox.module.exports;
}

function createClientFromEnv() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
        throw new Error("missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

function loadEnvFile(fileName) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const sourcePath = resolve(process.cwd(), "src/lib/outbound.ts");
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
    encodeURIComponent,
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(compiled, sandbox, { filename: sourcePath });

const {
    buildCashInStyleOutboundUrl,
    buildOutboundRedirectUrl,
    buildPlatformAffiliateUrl,
    getPlatformFallbackUrl,
} = sandbox.module.exports;

assert.equal(
    buildCashInStyleOutboundUrl({
        platform: { name: "CashInStyle", slug: "cashinstyle" },
        externalId: "cashinstyle-12345",
    }),
    "https://cashinstyle.com/walls/offers/12345?ref=earngrind",
);

assert.equal(
    buildCashInStyleOutboundUrl({
        platform: { name: "CashInStyle", slug: "cashinstyle" },
        externalId: "cashinstyle-cashinstyle-41370958-US",
        offerUrl: "https://cashinstyle.com/walls/offers/41370958?ref=earngrind",
    }),
    "https://cashinstyle.com/walls/offers/41370958?ref=earngrind",
);

assert.equal(
    buildCashInStyleOutboundUrl({
        platform: { name: "CashInStyle", slug: "cashinstyle" },
        externalId: "cashinstyle-cashinstyle-41370958-US",
    }),
    "https://cashinstyle.com/walls/offers/41370958?ref=earngrind",
);

assert.equal(
    buildCashInStyleOutboundUrl({
        platform: { name: "cash in style", slug: "cash-in-style" },
        externalId: "cashinstyle-OFFER_ID",
    }),
    "https://cashinstyle.com/?ref=earngrind",
);

assert.equal(
    buildCashInStyleOutboundUrl({
        platform: { name: "CashInStyles", slug: "cashinstyles" },
    }),
    "https://cashinstyle.com/?ref=earngrind",
);

assert.equal(
    buildCashInStyleOutboundUrl({
        platform: { name: "Freecash", slug: "freecash" },
        externalId: "cashinstyle-12345",
    }),
    null,
);

assert.equal(
    buildOutboundRedirectUrl({
        affiliateTemplate: null,
        destinationUrl: "https://example.com/direct",
    }),
    "https://example.com/direct",
);

assert.equal(
    buildPlatformAffiliateUrl({ platform: { name: "Gemsloot", slug: "gemsloot" } }),
    "https://gemsloot.com/?aff=kamedev",
);

assert.equal(
    buildPlatformAffiliateUrl({ platform: { name: "Gain.gg", slug: "gain-gg" } }),
    "https://gain.gg/r/macko",
);

assert.equal(
    buildPlatformAffiliateUrl({
        platform: { name: "Gain.gg", slug: "gain-gg" },
        destinationUrl: "https://gain.gg/offer/12345-abcd?ref=macko",
    }),
    "https://gain.gg/offer/12345-abcd?ref=macko",
);

assert.equal(
    buildPlatformAffiliateUrl({
        platform: { name: "Gain.gg", slug: "gain-gg" },
        destinationUrl: "https://example.com/not-gain",
    }),
    "https://gain.gg/r/macko",
);

assert.equal(
    buildPlatformAffiliateUrl({ platform: { name: "EarnLab", slug: "earnlab" } }),
    "https://earnlab.com/r/mac",
);

assert.equal(
    buildPlatformAffiliateUrl({ platform: { name: "KashKick", slug: "kashkick" } }),
    "https://app.kashkick.com?ref=MEF2ucEjcbtH",
);

assert.equal(
    buildPlatformAffiliateUrl({ platform: { name: "Swagbucks", slug: "swagbucks" } }),
    "https://www.swagbucks.com/profile/r_158565078?rp=1",
);

assert.equal(
    buildPlatformAffiliateUrl({ platform: { name: "InboxDollars", slug: "inboxdollars" } }),
    "https://www.inboxdollars.com?rb=193664312",
);

assert.equal(
    buildPlatformAffiliateUrl({ platform: { name: "PrizeRebel", slug: "prizerebel" } }),
    "https://www.prizerebel.com/index.php?r=16580973",
);

assert.equal(
    getPlatformFallbackUrl({ name: "Gemsloot", slug: "gemsloot" }),
    "https://gemsloot.com/?aff=kamedev",
);

console.log("CashInStyle outbound validation passed");

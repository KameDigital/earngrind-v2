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

console.log("CashInStyle outbound validation passed");

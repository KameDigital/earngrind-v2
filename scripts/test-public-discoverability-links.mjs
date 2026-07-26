import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/app/offers/page.tsx"), "utf8");
if (!source.includes("GEMSLOOT_PUBLIC_COUNTRIES.flatMap")) throw new Error("offers hub must derive Gemsloot links from the country registry");
for (const href of ["/offers/gemsloot/${country.slug}", "/offers/gemsloot/${country.slug}/${provider.slug}"]) {
  if (!source.includes(href)) throw new Error(`offers hub is missing country-aware Gemsloot link template: ${href}`);
}
console.log("public discoverability link checks passed");
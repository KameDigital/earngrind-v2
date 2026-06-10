import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const about = read("src/app/about/page.tsx");
const homepage = read("src/app/page.tsx");
const emailCapture = read("src/components/EmailCapture.tsx");
const subscribeRoute = read("src/app/api/subscribe/route.ts");
const guidePage = read("src/app/guides/[slug]/page.tsx");
const seoGuidePage = read("src/app/(seo)/guides/how-to-earn/[slug]/page.tsx");
const guideEmailSlot = read("src/app/guides/GuideEmailCaptureSlot.tsx");
const guideLayout = read("src/app/guides/layout.tsx");
const middleware = read("src/middleware.ts");

assert.match(about, /NEXT_PUBLIC_FOUNDER_TWITTER/);
assert.match(about, /Founder/);
assert.match(about, /<picture/);
assert.match(about, /rounded-full/);

assert.match(homepage, /PARTNER_LOGOS/);
for (const partner of ["Swagbucks", "Freecash", "Gain.gg", "InboxDollars", "EarnLab"]) {
  assert.match(homepage, new RegExp(partner.replace(".", "\\.")));
}
assert.match(homepage, /Tracks offers from:/);
assert.match(homepage, /grayscale/);

assert.match(emailCapture, /Get the week&apos;s highest-paying offers/);
assert.match(emailCapture, /fetch\("\/api\/subscribe"/);
assert.match(subscribeRoute, /TODO:.*Mailchimp\/ConvertKit/);
assert.match(subscribeRoute, /NextResponse\.json\(\{\s*success:\s*true\s*\}/);
assert.match(homepage, /<EmailCapture variant="inline" \/>/);
assert.match(guideEmailSlot, /<EmailCapture variant="stacked" \/>/);
assert.match(guideLayout, /<GuideEmailCaptureSlot \/>/);
assert.doesNotMatch(guidePage, /<EmailCapture variant="stacked" \/>/);
assert.match(seoGuidePage, /<EmailCapture variant="stacked" \/>/);

assert.match(homepage, /TabbedOfferRail/);
assert.match(homepage, /OFFER_RAIL_TABS/);
assert.doesNotMatch(homepage, /title="Featured EarnLab games"/);
assert.doesNotMatch(homepage, /title="Featured Gain\.gg games"/);
assert.doesNotMatch(homepage, /title="Featured CashInStyle games"/);

assert.match(homepage, /Featured this week/);
assert.match(homepage, /featuredPost/);
assert.match(homepage, /Read more →/);

assert.match(homepage, /Compare Live Offers/);
assert.match(homepage, /Browse Games/);
assert.doesNotMatch(homepage, /Best GPT Sites\s*<\/Link>/);

assert.match(middleware, /isAdminRoute/);
assert.match(middleware, /startsWith\('\/app\/admin'\)/);
assert.match(middleware, /NextResponse\.redirect\(new URL\('\/login'/);

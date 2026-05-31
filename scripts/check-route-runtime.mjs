import { chromium } from "playwright";

const baseUrl = process.env.ROUTE_CHECK_BASE_URL ?? "http://localhost:3000";

const requiredRoutes = [
  "/",
  "/offers",
  "/games",
  "/guides",
  "/best-gpt-sites",
  "/platforms",
  "/offers/us",
  "/offers/gain/us/native",
  "/offers/gemsloot/us/tyrads",
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  for (const route of requiredRoutes) {
    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    const status = response?.status() ?? 0;
    const mobileOverflow = await page.evaluate(() => (
      Math.ceil(document.documentElement.scrollWidth) > Math.ceil(document.documentElement.clientWidth)
    ));

    console.log(`${route} status=${status} final=${page.url()} mobileOverflow=${mobileOverflow}`);

    if (status >= 400) {
      throw new Error(`${route} returned status ${status}`);
    }
    if (mobileOverflow) {
      throw new Error(`${route} has horizontal overflow on mobile`);
    }
  }

  const reviewResponse = await page.goto(`${baseUrl}/reviews`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  console.log(`/reviews status=${reviewResponse?.status() ?? 0} final=${page.url()}`);
  if (!page.url().endsWith("/platforms")) {
    throw new Error("/reviews did not redirect to /platforms");
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const homeHubCtas = await page.locator([
    "a[href='/offers']",
    "a[href='/games']",
    "a[href='/guides']",
    "a[href='/best-gpt-sites']",
    "a[href='/platforms']",
  ].join(", ")).count();
  console.log(`home hub CTA count=${homeHubCtas}`);
  if (homeHubCtas < 5) {
    throw new Error("missing homepage hub CTAs");
  }

  await page.goto(`${baseUrl}/offers`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const offersHubCtas = await page.locator([
    "a[href='/offers/gain/us']",
    "a[href='/offers/gemsloot/us']",
    "a[href='/offers/us']",
  ].join(", ")).count();
  console.log(`offers hub CTA count=${offersHubCtas}`);
  if (offersHubCtas < 3) {
    throw new Error("missing offers hub CTAs");
  }
} finally {
  await browser.close();
}

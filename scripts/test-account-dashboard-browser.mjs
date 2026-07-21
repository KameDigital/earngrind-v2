import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.ACCOUNT_DASHBOARD_BASE_URL ?? "http://localhost:3015";
const output = execFileSync(process.env.SUPABASE_BIN ?? "supabase", ["status", "--workdir", ".", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const env = Object.fromEntries(output.split(/\r?\n/).map((line) => line.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(([, key, value]) => [key, value.replace(/^"|"$/g, "")]));
for (const key of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"]) assert.ok(env[key], `local Supabase ${key} is required`);
const service = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const password = `Browser-${crypto.randomBytes(18).toString("base64url")}!`;
const users = [];

async function fixture(label, offerId) {
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(error, null, `create ${label}`);
  const userId = data.user?.id;
  assert.ok(userId, `${label} id`);
  users.push(userId);
  const { error: insertError } = await service.from("user_offer_favorites").insert({
    user_id: userId, offer_source: "manual", offer_id: offerId, title: `${label} private favorite`, image_url: "https://images.example.test/missing.png", payout_usd: 7, platform_name: "Local fixture", country_code: "US", devices: ["web"], offer_path: `/offers/${label}-fixture`,
  });
  assert.equal(insertError, null, `seed ${label} favorite`);
  return { email, title: `${label} private favorite` };
}

async function login(context, user) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login?next=%2Faccount`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/account$/, { timeout: 15000 });
  return page;
}

const browser = await chromium.launch({ headless: true });
try {
  const a = await fixture("browser-user-a", "10000000-0000-4000-8000-000000000001");
  const b = await fixture("browser-user-b", "10000000-0000-4000-8000-000000000002");
  const contextA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pageA = await login(contextA, a);
  await pageA.getByText(a.title, { exact: true }).waitFor();
  assert.equal(await pageA.getByText(b.title, { exact: true }).count(), 0, "User A must not render User B data");
  const accountResponse = await pageA.goto(`${baseUrl}/account`, { waitUntil: "networkidle" });
  assert.match(accountResponse?.headers()["cache-control"] ?? "", /no-store|private/i, "private account response must not be shared-cacheable");
  await pageA.getByText(a.title, { exact: true }).waitFor();
  await pageA.locator("#main-content").getByRole("link", { name: "Settings" }).click();
  await pageA.waitForURL(/\/account\/settings$/, { timeout: 15000 });
  await pageA.goto(`${baseUrl}/account`, { waitUntil: "networkidle" });
  await pageA.getByRole("button", { name: "Remove" }).click();
  await pageA.getByText(a.title, { exact: true }).waitFor({ state: "detached" });

  const contextB = await browser.newContext({ viewport: { width: 768, height: 900 } });
  const pageB = await login(contextB, b);
  await pageB.getByText(b.title, { exact: true }).waitFor();
  assert.equal(await pageB.getByText(a.title, { exact: true }).count(), 0, "User B must not render User A data");
  for (const width of [1280, 768, 375]) {
    await pageB.setViewportSize({ width, height: 800 });
    const overflow = await pageB.evaluate(() => Array.from(document.querySelectorAll("*")).filter((node) => node instanceof HTMLElement && node.scrollWidth > document.documentElement.clientWidth && !Array.from(node.children).some((child) => child instanceof HTMLElement && child.scrollWidth > document.documentElement.clientWidth)).slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: node.className, text: node.textContent?.slice(0, 80), scrollWidth: node.scrollWidth })));
    assert.equal(overflow.length, 0, `no horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
  }
  assert.equal(await pageB.getByRole("button", { name: "Remove" }).getAttribute("aria-pressed"), null, "dashboard removal remains a native button");

  const signedOut = await browser.newContext();
  const signedOutPage = await signedOut.newPage();
  await signedOutPage.goto(`${baseUrl}/account`, { waitUntil: "networkidle" });
  await signedOutPage.waitForURL(/\/login\?next=%2Faccount$/, { timeout: 15000 });
  await signedOut.close();
  await contextA.close();
  await contextB.close();
  console.log("Local dashboard browser test passed: protected route, per-user rendering, server-action removal, settings, cache safety, and responsive overflow.");
} finally {
  await browser.close();
  for (const userId of users.reverse()) await service.auth.admin.deleteUser(userId).catch(() => undefined);
}
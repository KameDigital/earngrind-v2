#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);
const REQUIRED_FILES = ["facts.json", "sources.md", "angle.md"];
const FACT_ARRAYS = new Set([
  "features",
  "earning_methods",
  "bonuses",
  "withdrawals",
  "app_game_offers",
  "faqs",
  "support",
  "trust_signals",
  "unique_features",
  "pros",
  "cons",
  "risks",
  "user_fit",
  "source_proof",
]);

function usage() {
  console.log(`earngrind-audit

Usage:
  earngrind-audit init <site-url>
  earngrind-audit add-source <site-slug> <url> --note "<what this source proves>"
  earngrind-audit add-fact <site-slug> --type "<type>" --claim "<claim>" --url "<url>" --evidence "<text or screenshot path>" --confidence high|medium|low
  earngrind-audit screenshot <site-slug> <url> --name "<safe-file-name>" [--mobile]
  earngrind-audit validate <site-slug>
  earngrind-audit summary <site-slug>
`);
}

function fail(message, code = 1) {
  console.error(`Error: ${message}`);
  process.exit(code);
}

function parseFlags(args) {
  const flags = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("--")) {
      fail(`Unexpected argument "${arg}"`);
    }

    const key = arg.slice(2);
    const value = args[index + 1];

    if (!key) {
      fail(`Invalid flag "${arg}"`);
    }

    if (value === undefined || value.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    if (!String(value).trim()) {
      fail(`Missing value for --${key}`);
    }

    flags[key] = value;
    index += 1;
  }

  return flags;
}

function requireFlags(flags, names) {
  for (const name of names) {
    if (flags[name] === true || !flags[name] || !String(flags[name]).trim()) {
      fail(`Missing required --${name}`);
    }
  }
}

function siteDir(siteSlug) {
  assertSafeSlug(siteSlug);
  return path.join(process.cwd(), "research", siteSlug);
}

function screenshotsDir(siteSlug) {
  return path.join(siteDir(siteSlug), "screenshots");
}

function assertSafeSlug(siteSlug) {
  if (!isSafeSlug(siteSlug)) {
    fail(`Invalid site slug "${siteSlug}". Use lowercase letters, numbers, and hyphens only.`);
  }
}

function isSafeSlug(value) {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(value);
}

function safeFileName(value) {
  const name = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.png$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!isSafeSlug(name)) {
    fail(`Invalid --name "${value}". Use a safe lowercase file name such as "homepage" or "faq-cashout".`);
  }

  return name;
}

function slugFromUrl(siteUrl) {
  let parsed;

  try {
    parsed = new URL(siteUrl);
  } catch {
    fail(`Invalid site URL "${siteUrl}"`);
  }

  return parsed.hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Could not read JSON at ${path.relative(process.cwd(), filePath)}: ${error.message}`);
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function initialFacts(siteUrl, siteSlug) {
  return {
    site: {
      name: "",
      url: siteUrl,
      slug: siteSlug,
      audited_at: new Date().toISOString(),
      public_pages_only: true,
    },
    facts: [],
    features: [],
    earning_methods: [],
    bonuses: [],
    withdrawals: [],
    app_game_offers: [],
    faqs: [],
    support: [],
    trust_signals: [],
    unique_features: [],
    pros: [],
    cons: [],
    risks: [],
    user_fit: [],
    source_proof: [],
  };
}

function ensureResearchFolder(siteSlug) {
  const dir = siteDir(siteSlug);
  fs.mkdirSync(screenshotsDir(siteSlug), { recursive: true });
  return dir;
}

function init(siteUrl) {
  if (!siteUrl) {
    fail("Missing <site-url>");
  }

  const siteSlug = slugFromUrl(siteUrl);
  const dir = ensureResearchFolder(siteSlug);
  const factsPath = path.join(dir, "facts.json");
  const sourcesPath = path.join(dir, "sources.md");
  const anglePath = path.join(dir, "angle.md");

  if (!fs.existsSync(factsPath)) {
    writeJson(factsPath, initialFacts(siteUrl, siteSlug));
  }

  if (!fs.existsSync(sourcesPath)) {
    fs.writeFileSync(sourcesPath, `# Sources: ${siteSlug}\n\n`, "utf8");
  }

  if (!fs.existsSync(anglePath)) {
    fs.writeFileSync(anglePath, `# Angle: ${siteSlug}\n\n`, "utf8");
  }

  console.log(JSON.stringify({
    site_slug: siteSlug,
    research_dir: path.relative(process.cwd(), dir),
    created: REQUIRED_FILES.map((file) => path.join("research", siteSlug, file)),
    screenshots_dir: path.join("research", siteSlug, "screenshots"),
  }, null, 2));
}

function addSource(siteSlug, url, rest) {
  if (!siteSlug || !url) {
    fail("Usage: earngrind-audit add-source <site-slug> <url> --note \"<what this source proves>\"");
  }

  const flags = parseFlags(rest);
  requireFlags(flags, ["note"]);
  const dir = ensureResearchFolder(siteSlug);
  const sourcesPath = path.join(dir, "sources.md");

  if (!fs.existsSync(sourcesPath)) {
    fs.writeFileSync(sourcesPath, `# Sources: ${siteSlug}\n\n`, "utf8");
  }

  fs.appendFileSync(sourcesPath, `- ${url} - ${flags.note}\n`, "utf8");
  console.log(JSON.stringify({ site_slug: siteSlug, source_url: url, sources_path: path.relative(process.cwd(), sourcesPath) }, null, 2));
}

function addFact(siteSlug, rest) {
  if (!siteSlug) {
    fail("Usage: earngrind-audit add-fact <site-slug> --type \"<type>\" --claim \"<claim>\" --url \"<url>\" --evidence \"<text or screenshot path>\" --confidence high|medium|low");
  }

  const flags = parseFlags(rest);
  requireFlags(flags, ["type", "claim", "url", "evidence", "confidence"]);

  if (!VALID_CONFIDENCE.has(flags.confidence)) {
    fail("--confidence must be high, medium, or low");
  }

  const dir = ensureResearchFolder(siteSlug);
  const factsPath = path.join(dir, "facts.json");
  const facts = fs.existsSync(factsPath)
    ? readJson(factsPath)
    : initialFacts("", siteSlug);
  const evidence = flags.evidence;
  const isScreenshot = looksLikeScreenshotPath(evidence);
  const fact = {
    type: flags.type,
    claim: flags.claim,
    source_url: flags.url,
    screenshot_path: isScreenshot ? evidence : "",
    extracted_text: isScreenshot ? "" : evidence,
    evidence,
    confidence: flags.confidence,
    uncertain: flags.confidence === "low",
    notes: "",
    added_at: new Date().toISOString(),
  };

  if (!Array.isArray(facts.facts)) {
    facts.facts = [];
  }

  facts.facts.push(fact);

  if (FACT_ARRAYS.has(flags.type)) {
    if (!Array.isArray(facts[flags.type])) {
      facts[flags.type] = [];
    }
    facts[flags.type].push(fact);
  }

  writeJson(factsPath, facts);
  console.log(JSON.stringify({ site_slug: siteSlug, fact_count: facts.facts.length, facts_path: path.relative(process.cwd(), factsPath) }, null, 2));
}

async function screenshot(siteSlug, url, rest) {
  if (!siteSlug || !url) {
    fail("Usage: earngrind-audit screenshot <site-slug> <url> --name \"<safe-file-name>\" [--mobile]");
  }

  assertPublicHttpUrl(url);
  const flags = parseFlags(rest);
  requireFlags(flags, ["name"]);
  const fileName = safeFileName(flags.name);
  const dir = ensureResearchFolder(siteSlug);
  const screenshotPath = path.join(screenshotsDir(siteSlug), `${fileName}.png`);
  const relativeScreenshotPath = path.relative(process.cwd(), screenshotPath).replaceAll("\\", "/");
  const viewport = flags.mobile
    ? { width: 390, height: 844, isMobile: true }
    : { width: 1440, height: 1000, isMobile: false };

  let browser;
  let cookiePopupNote = "No cookie popup action was needed.";

  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      userAgent: viewport.isMobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(25_000);

    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });

    if (!response) {
      failScreenshot(url, "No response was returned. The page may be blocked, unreachable, or intercepted by a browser-level protection.");
    }

    const status = response.status();

    if (status === 401 || status === 403) {
      failScreenshot(url, `HTTP ${status}. The page appears blocked or private; not attempting to bypass protections.`);
    }

    if (status >= 400) {
      failScreenshot(url, `HTTP ${status}. Capture skipped because the public page did not load successfully.`);
    }

    cookiePopupNote = await dismissCookiePopup(page);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    failScreenshot(url, classifyScreenshotError(error));
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }

  appendScreenshotSource(siteSlug, url, relativeScreenshotPath, flags.mobile ? "mobile" : "desktop", cookiePopupNote);
  appendScreenshotFact(siteSlug, url, relativeScreenshotPath, flags.mobile ? "mobile" : "desktop", cookiePopupNote);

  console.log(JSON.stringify({
    site_slug: siteSlug,
    source_url: url,
    screenshot_path: relativeScreenshotPath,
    viewport: flags.mobile ? "mobile" : "desktop",
    note: cookiePopupNote,
    sources_path: path.relative(process.cwd(), path.join(dir, "sources.md")).replaceAll("\\", "/"),
  }, null, 2));
}

function assertPublicHttpUrl(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    fail(`Invalid URL "${url}"`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    fail("Only public http:// or https:// URLs are supported.");
  }

  if (parsed.username || parsed.password) {
    fail("URLs with embedded credentials are not allowed.");
  }
}

async function dismissCookiePopup(page) {
  const labels = [
    "Accept all",
    "Accept",
    "I agree",
    "Agree",
    "Got it",
    "Allow all",
    "OK",
    "Continue",
    "Reject all",
  ];

  for (const label of labels) {
    const button = page.getByRole("button", { name: new RegExp(`^${escapeRegExp(label)}$`, "i") }).first();

    try {
      if (await button.isVisible({ timeout: 1_000 })) {
        await button.click({ timeout: 2_000 });
        return `Clicked visible cookie or consent button: "${label}".`;
      }
    } catch {
      // Keep this best-effort only; do not block capture if no common banner is present.
    }
  }

  return "No cookie popup action was needed.";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function failScreenshot(url, reason) {
  fail(`Could not capture screenshot for ${url}: ${reason}`);
}

function classifyScreenshotError(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (/Timeout/i.test(message)) {
    return `Timed out while loading or capturing the page. The page may be slow, blocked, or waiting on a cookie popup. Detail: ${message}`;
  }

  if (/net::ERR|NS_ERROR|SSL|certificate|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    return `Network or certificate error while loading the public URL. Detail: ${message}`;
  }

  if (/Target page|browser has been closed|Execution context was destroyed/i.test(message)) {
    return `The page closed or navigated unexpectedly during capture. Detail: ${message}`;
  }

  return message;
}

function appendScreenshotSource(siteSlug, url, screenshotPath, viewport, cookiePopupNote) {
  const dir = ensureResearchFolder(siteSlug);
  const sourcesPath = path.join(dir, "sources.md");

  if (!fs.existsSync(sourcesPath)) {
    fs.writeFileSync(sourcesPath, `# Sources: ${siteSlug}\n\n`, "utf8");
  }

  fs.appendFileSync(
    sourcesPath,
    `- ${url} - Screenshot captured at \`${screenshotPath}\` using ${viewport} viewport. ${cookiePopupNote}\n`,
    "utf8",
  );
}

function appendScreenshotFact(siteSlug, url, screenshotPath, viewport, cookiePopupNote) {
  const dir = ensureResearchFolder(siteSlug);
  const factsPath = path.join(dir, "facts.json");
  const facts = fs.existsSync(factsPath)
    ? readJson(factsPath)
    : initialFacts("", siteSlug);
  const fact = {
    type: "source_proof",
    claim: `Screenshot evidence captured for ${url}.`,
    source_url: url,
    screenshot_path: screenshotPath,
    extracted_text: "",
    evidence: screenshotPath,
    confidence: "high",
    uncertain: false,
    notes: `Captured with ${viewport} viewport. ${cookiePopupNote}`,
    added_at: new Date().toISOString(),
  };

  if (!Array.isArray(facts.facts)) {
    facts.facts = [];
  }

  if (!Array.isArray(facts.source_proof)) {
    facts.source_proof = [];
  }

  facts.facts.push(fact);
  facts.source_proof.push(fact);
  writeJson(factsPath, facts);
}

function looksLikeScreenshotPath(value) {
  return /(^|[/\\])screenshots[/\\].+\.(png|jpe?g|webp)$/i.test(value)
    || /\.(png|jpe?g|webp)$/i.test(value);
}

function collectValidation(siteSlug) {
  if (!siteSlug) {
    fail("Missing <site-slug>");
  }

  const dir = siteDir(siteSlug);
  const errors = [];
  const warnings = [];
  const files = {};

  for (const file of REQUIRED_FILES) {
    const filePath = path.join(dir, file);
    files[file] = fs.existsSync(filePath);
    if (!files[file]) {
      errors.push(`Missing research/${siteSlug}/${file}`);
    }
  }

  const screenshotCount = countScreenshots(siteSlug);

  if (screenshotCount < 6) {
    warnings.push(`Only ${screenshotCount} screenshot(s) found; capture at least 6 meaningful screenshots where possible.`);
  }

  let factsCount = 0;

  if (files["facts.json"]) {
    const facts = readJson(path.join(dir, "facts.json"));
    const factRows = Array.isArray(facts.facts) ? facts.facts : [];
    factsCount = factRows.length;

    factRows.forEach((fact, index) => {
      if (!fact.source_url) {
        errors.push(`facts[${index}] is missing source_url`);
      }
      if (!fact.evidence && !fact.screenshot_path && !fact.extracted_text) {
        errors.push(`facts[${index}] is missing evidence, screenshot_path, or extracted_text`);
      }
      if (!VALID_CONFIDENCE.has(fact.confidence)) {
        errors.push(`facts[${index}] has invalid confidence "${fact.confidence}"`);
      }
    });
  }

  const result = {
    site_slug: siteSlug,
    valid: errors.length === 0,
    files,
    facts_count: factsCount,
    screenshot_count: screenshotCount,
    errors,
    warnings,
  };

  return result;
}

function validate(siteSlug, { printJson = false } = {}) {
  const result = collectValidation(siteSlug);

  if (printJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const error of result.errors) {
      console.error(`ERROR: ${error}`);
    }
    for (const warning of result.warnings) {
      console.warn(`WARN: ${warning}`);
    }
    console.log(result.valid ? "Validation passed" : "Validation failed");
  }

  process.exitCode = result.valid ? 0 : 1;
  return result;
}

function countScreenshots(siteSlug) {
  const dir = screenshotsDir(siteSlug);

  if (!fs.existsSync(dir)) {
    return 0;
  }

  return fs.readdirSync(dir)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .length;
}

function summary(siteSlug) {
  if (!siteSlug) {
    fail("Missing <site-slug>");
  }

  const validation = collectValidation(siteSlug);
  const dir = siteDir(siteSlug);
  const factsPath = path.join(dir, "facts.json");
  const facts = fs.existsSync(factsPath) ? readJson(factsPath) : {};
  const rows = Array.isArray(facts.facts) ? facts.facts : [];

  console.log(JSON.stringify({
    site_slug: siteSlug,
    site_url: facts.site?.url || "",
    facts_count: rows.length,
    fact_types: [...new Set(rows.map((fact) => fact.type).filter(Boolean))].sort(),
    screenshots_count: validation.screenshot_count,
    required_files_present: validation.files,
    errors_count: validation.errors.length,
    warnings_count: validation.warnings.length,
    warnings: validation.warnings,
  }));

  process.exitCode = validation.valid ? 0 : 1;
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "init":
    init(args[0]);
    break;
  case "add-source":
    addSource(args[0], args[1], args.slice(2));
    break;
  case "add-fact":
    addFact(args[0], args.slice(1));
    break;
  case "screenshot":
    await screenshot(args[0], args[1], args.slice(2));
    break;
  case "validate":
    validate(args[0], { printJson: true });
    break;
  case "summary":
    summary(args[0]);
    break;
  case "-h":
  case "--help":
  case undefined:
    usage();
    process.exit(command ? 0 : 1);
    break;
  default:
    usage();
    fail(`Unknown command "${command}"`);
}

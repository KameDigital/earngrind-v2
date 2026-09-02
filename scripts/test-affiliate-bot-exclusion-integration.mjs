import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const databaseUrl = process.env.DB_URL;
const appBaseUrl = process.env.APP_BASE_URL;

function requireLocalUrl(name, value) {
    assert.ok(value, `${name} is required`);
    const url = new URL(value);
    assert.ok(
        url.hostname === "127.0.0.1" || url.hostname === "localhost",
        `${name} must point to a local/disposable service, received ${url.hostname}`,
    );
    return url.origin;
}

const localApiUrl = requireLocalUrl("API_URL", apiUrl);
const localAppUrl = requireLocalUrl("APP_BASE_URL", appBaseUrl);
requireLocalUrl("DB_URL", databaseUrl);

const { Pool } = pg;
const db = new Pool({ connectionString: databaseUrl });
const runId = randomUUID();
const ids = {
    earnlabPlatform: randomUUID(),
    freecashPlatform: randomUUID(),
    scramblyPlatform: randomUUID(),
    game: randomUUID(),
    provider: randomUUID(),
    offer: randomUUID(),
    siteOffer: randomUUID(),
    earnlabOffer: randomUUID(),
};
const earnlabTaskId = randomUUID();
const expectedEarnlabUrl = `https://earnlab.com/tasks?modal=task&task-id=${earnlabTaskId}&code=mac`;
const expectedFreecashUrl = "https://freecash.com/?ref=earngrind";
const expectedScramblyUrl = "https://scrambly.io/?ref=3P5OXUA";
const humanUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36";

async function insert(table, rows) {
    const rowList = Array.isArray(rows) ? rows : [rows];
    for (const row of rowList) {
        const columns = Object.keys(row);
        const placeholders = columns.map((_, index) => `$${index + 1}`);
        await db.query(
            `insert into public.${table} (${columns.join(", ")}) values (${placeholders.join(", ")})`,
            columns.map((column) => row[column]),
        );
    }
}

async function selectRows(table, column, id) {
    const { rows } = await db.query(`select * from public.${table} where ${column} = $1`, [id]);
    return rows;
}

async function revenueRows(offerId) {
    const { rows } = await db.query(
        "select * from public.revenue_events where event_name = 'outbound_click' and offer_id = $1",
        [offerId],
    );
    return rows;
}

async function requestRedirect(path, userAgent) {
    const response = await fetch(`${localAppUrl}${path}`, {
        headers: {
            "user-agent": userAgent,
            "x-forwarded-for": "127.0.0.42",
        },
        redirect: "manual",
    });
    assert.equal(response.status, 302, `Expected 302 for ${path}, received ${response.status}`);
    return response.headers.get("location");
}

async function cleanup() {
    await db.query("delete from public.revenue_events where offer_id = any($1::text[])", [[ids.offer, ids.siteOffer, ids.earnlabOffer]]);
    await db.query("delete from public.offer_clicks where offer_id = $1", [ids.offer]);
    await db.query("delete from public.site_offer_clicks where site_offer_id = any($1::uuid[])", [[ids.siteOffer, ids.earnlabOffer]]);
    await db.query("delete from public.offers where id = $1", [ids.offer]);
    await db.query("delete from public.site_offers where id = any($1::uuid[])", [[ids.siteOffer, ids.earnlabOffer]]);
    await db.query("delete from public.providers where id = $1", [ids.provider]);
    await db.query("delete from public.games where id = $1", [ids.game]);
    await db.query("delete from public.platforms where id = any($1::uuid[])", [[ids.earnlabPlatform, ids.freecashPlatform, ids.scramblyPlatform]]);
}

try {
    await insert("platforms", [
        { id: ids.earnlabPlatform, name: `EarnLab test ${runId}`, slug: `earnlab-test-${runId}`, platform_kind: "gpt_site", affiliate_template: "https://earnlab.com/r/mac" },
        { id: ids.freecashPlatform, name: `Freecash test ${runId}`, slug: `freecash-test-${runId}`, platform_kind: "gpt_site", affiliate_template: "https://freecash.com/?ref=earngrind" },
        { id: ids.scramblyPlatform, name: `Scrambly test ${runId}`, slug: `scrambly-test-${runId}`, platform_kind: "gpt_site", affiliate_template: "https://scrambly.io/?ref=3P5OXUA" },
    ]);
    await insert("games", { id: ids.game, name: `Bot exclusion test ${runId}`, slug: `bot-exclusion-test-${runId}` });
    await insert("providers", { id: ids.provider, name: `Provider test ${runId}`, slug: `provider-test-${runId}` });
    await insert("offers", {
        id: ids.offer,
        game_id: ids.game,
        platform_id: ids.freecashPlatform,
        title: "Freecash bot exclusion test",
        payout_usd: 12.34,
        custom_param: "https://freecash.com/",
        status: "active",
    });
    await insert("site_offers", [
        {
            id: ids.siteOffer,
            site_id: ids.scramblyPlatform,
            provider_id: ids.provider,
            game_id: ids.game,
            external_id: `scrambly-${runId}`,
            title: "Scrambly bot exclusion test",
            goal_text: "Reach the test milestone",
            payout_usd: 23.45,
            offer_url: "https://scrambly.io/",
            status: "active",
        },
        {
            id: ids.earnlabOffer,
            site_id: ids.earnlabPlatform,
            provider_id: ids.provider,
            game_id: ids.game,
            external_id: `${earnlabTaskId}-US`,
            title: "EarnLab task-modal test",
            payout_usd: 34.56,
            offer_url: "https://earnlab.com/tasks",
            status: "active",
        },
    ]);

    const botOfferLocation = await requestRedirect(
        `/go/${ids.offer}?click_location=bot_offer&source_context=cluster_d_bot`,
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    );
    assert.equal(botOfferLocation, expectedFreecashUrl);

    const botSiteOfferLocation = await requestRedirect(
        `/go/${ids.siteOffer}?click_location=bot_site_offer&source_context=cluster_d_bot`,
        "ExampleCrawler/1.0",
    );
    assert.equal(botSiteOfferLocation, expectedScramblyUrl);

    assert.equal((await selectRows("offer_clicks", "offer_id", ids.offer)).length, 0, "Googlebot must not write offer_clicks");
    assert.equal((await selectRows("site_offer_clicks", "site_offer_id", ids.siteOffer)).length, 0, "Crawler must not write site_offer_clicks");
    assert.equal((await revenueRows(ids.offer)).length, 0, "Googlebot must not write revenue_events");
    assert.equal((await revenueRows(ids.siteOffer)).length, 0, "Crawler must not write revenue_events");

    const humanOfferLocation = await requestRedirect(
        `/go/${ids.offer}?click_location=human_offer&source_context=cluster_d_human`,
        humanUserAgent,
    );
    assert.equal(humanOfferLocation, expectedFreecashUrl);

    const humanSiteOfferLocation = await requestRedirect(
        `/go/${ids.siteOffer}?click_location=human_site_offer&source_context=cluster_d_human`,
        humanUserAgent,
    );
    assert.equal(humanSiteOfferLocation, expectedScramblyUrl);

    const offerClicks = await selectRows("offer_clicks", "offer_id", ids.offer);
    assert.equal(offerClicks.length, 1);
    assert.equal(offerClicks[0].click_location, "human_offer");
    assert.equal(offerClicks[0].source_context, "cluster_d_human");
    assert.equal(offerClicks[0].destination_url, expectedFreecashUrl);

    const siteOfferClicks = await selectRows("site_offer_clicks", "site_offer_id", ids.siteOffer);
    assert.equal(siteOfferClicks.length, 1);
    assert.equal(siteOfferClicks[0].click_location, "human_site_offer");
    assert.equal(siteOfferClicks[0].source_context, "cluster_d_human");
    assert.equal(siteOfferClicks[0].destination_url, expectedScramblyUrl);

    const offerRevenue = await revenueRows(ids.offer);
    assert.equal(offerRevenue.length, 1);
    assert.equal(offerRevenue[0].cta_location, "human_offer");
    assert.equal(offerRevenue[0].source_context, "cluster_d_human");
    assert.equal(offerRevenue[0].target_url, expectedFreecashUrl);

    const siteOfferRevenue = await revenueRows(ids.siteOffer);
    assert.equal(siteOfferRevenue.length, 1);
    assert.equal(siteOfferRevenue[0].cta_location, "human_site_offer");
    assert.equal(siteOfferRevenue[0].source_context, "cluster_d_human");
    assert.equal(siteOfferRevenue[0].target_url, expectedScramblyUrl);

    const earnlabLocation = await requestRedirect(`/go/${ids.earnlabOffer}`, humanUserAgent);
    assert.equal(earnlabLocation, expectedEarnlabUrl);

    console.log("PASS: bot requests redirect without click/revenue writes");
    console.log("PASS: browser requests preserve click_location, source_context, and target URL");
    console.log(`PASS: EarnLab task modal URL = ${expectedEarnlabUrl}`);
    console.log(`PASS: Freecash affiliate URL = ${expectedFreecashUrl}`);
    console.log(`PASS: Scrambly affiliate URL = ${expectedScramblyUrl}`);
} finally {
    await cleanup();
    await db.end();
}

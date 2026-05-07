import { createClient } from "@supabase/supabase-js";
import {
    buildFallbackTaskTitle,
    fetchAll,
    firstRelated,
    inferFallbackTaskType,
    loadEnvFiles,
    normalizeProviderDisplayName,
    normalizeTotalPayout,
    parseArgs,
    toNumber,
    writeCsvReport,
    writeJsonReport,
} from "./_offer-quality-utils.mjs";

loadEnvFiles();
const args = parseArgs();
if (args.help) {
    printHelp();
    process.exit(0);
}
const apply = Boolean(args.apply);
const dryRun = !apply;
const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Number(args.limit)) : null;
const platformFilter = typeof args.platform === "string" ? args.platform.toLowerCase() : null;
const providerFilter = typeof args.provider === "string" ? args.provider.toLowerCase() : null;
const includeLowConfidence = Boolean(args["include-low-confidence"]);
const minConfidence = normalizeConfidence(args["min-confidence"] ?? (apply && !includeLowConfidence ? "medium" : "low"));
const writeReport = typeof args["write-report"] === "string" ? args["write-report"] : null;
const writeReportCsv = typeof args["write-report-csv"] === "string" ? args["write-report-csv"] : null;

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase URL or service role key.");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const rows = await fetchAll(
    db,
    "site_offers",
    `id, external_id, title, payout_usd, total_payout_usd, goal_text, status, updated_at,
     site:platforms(id, name, slug), provider:providers(id, name, slug), tasks:site_offer_tasks(id)`,
    (query) => query.eq("status", "active"),
);

const candidates = rows
    .filter((row) => !Array.isArray(row.tasks) || row.tasks.length === 0)
    .filter((row) => {
        const platform = String(firstRelated(row.site)?.slug ?? firstRelated(row.site)?.name ?? "").toLowerCase();
        const provider = normalizeProviderDisplayName(firstRelated(row.provider)?.name).toLowerCase();
        if (platformFilter && !platform.includes(platformFilter)) return false;
        if (providerFilter && !provider.includes(providerFilter)) return false;
        return true;
    })
    .slice(0, limit ?? Number.MAX_SAFE_INTEGER);

const totals = {
    dryRun,
    proposed: candidates.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
    byPlatformProvider: {},
};
const proposed = [];

for (const row of candidates) {
    const platform = firstRelated(row.site)?.slug ?? "unknown";
    const provider = normalizeProviderDisplayName(firstRelated(row.provider)?.name);
    const groupKey = `${platform} / ${provider}`;
    totals.byPlatformProvider[groupKey] = (totals.byPlatformProvider[groupKey] ?? 0) + 1;

    const text = `${row.title ?? ""} ${row.goal_text ?? ""}`;
    const inference = inferTaskWithReason(text);
    if (!meetsMinConfidence(inference.confidence, minConfidence)) {
        totals.skipped += 1;
        const skipped = {
            offer_id: row.id,
            external_id: row.external_id,
            offer_title: row.title,
            platform,
            provider,
            payout_usd: normalizeTotalPayout(toNumber(row.payout_usd), row.total_payout_usd),
            inferred_task_type: inference.task_type,
            inference_reason: inference.reason,
            confidence: inference.confidence,
            skipped_reason: `below_min_confidence_${minConfidence}`,
        };
        proposed.push(skipped);
        console.log(JSON.stringify({ action: "skip_confidence", ...skipped }));
        continue;
    }
    const payout = normalizeTotalPayout(toNumber(row.payout_usd), row.total_payout_usd);
    const task = {
        site_offer_id: row.id,
        sort_order: 0,
        title: buildFallbackTaskTitle(row.title, row.goal_text),
        reward_amount: payout,
        reward_display: payout > 0 ? `$${payout.toFixed(2)}` : null,
        task_type: inference.task_type,
        time_limit_text: null,
        notes: row.goal_text || row.title || null,
    };

    const logRow = {
        offer_id: row.id,
        external_id: row.external_id,
        site_offer_id: row.id,
        platform,
        provider,
        offer_title: row.title,
        payout_usd: payout,
        inferred_task_type: inference.task_type,
        proposed_task_title: task.title,
        proposed_reward_amount: task.reward_amount,
        proposed_reward_display: task.reward_display,
        inference_reason: inference.reason,
        confidence: inference.confidence,
        task,
    };
    proposed.push(logRow);
    console.log(JSON.stringify({ action: dryRun ? "propose_insert" : "insert", ...logRow }));

    if (dryRun) continue;

    try {
        const { data: existingTasks, error: checkError } = await db
            .from("site_offer_tasks")
            .select("id")
            .eq("site_offer_id", row.id)
            .limit(1);
        if (checkError) throw new Error(checkError.message);
        if (existingTasks?.length) {
            totals.skipped += 1;
            continue;
        }

        const now = new Date().toISOString();
        const { error } = await db.from("site_offer_tasks").insert({
            ...task,
            created_at: now,
            updated_at: now,
        });
        if (error) throw new Error(error.message);
        totals.inserted += 1;
    } catch (error) {
        totals.failed += 1;
        console.error("[backfill-taskless-site-offers] failed", {
            offer_id: row.id,
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

const report = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    options: {
        platform: platformFilter,
        provider: providerFilter,
        limit,
        apply,
        min_confidence: minConfidence,
        include_low_confidence: includeLowConfidence,
    },
    totals,
    proposed,
    workflow: recommendedWorkflow(),
};

if (writeReport) {
    writeJsonReport(writeReport, report);
    console.error(`[backfill-taskless-site-offers] wrote JSON report to ${writeReport}`);
}
if (writeReportCsv) {
    writeCsvReport(writeReportCsv, proposed);
    console.error(`[backfill-taskless-site-offers] wrote CSV report to ${writeReportCsv}`);
}

console.log(JSON.stringify({ totals, sample: proposed.slice(0, 25) }, null, 2));

function inferTaskWithReason(text) {
    const value = String(text ?? "").toLowerCase();
    const rules = [
        { type: "purchase", confidence: "high", reason: "matched purchase/deposit/spend wording", regex: /\bpurchase|buy|deposit|spend|recharge|pack\b/ },
        { type: "signup", confidence: "high", reason: "matched signup/register/account wording", regex: /\bsign ?up|signup|register|account|join\b/ },
        { type: "milestone", confidence: "high", reason: "matched level/reach/complete/chapter/stage wording", regex: /\breach|complete|level|chapter|stage|mission|milestone|board|village\b/ },
        { type: "install", confidence: "high", reason: "matched install/download/open/start/play wording", regex: /\binstall|download|open|start|play|launch\b/ },
        { type: "milestone", confidence: "medium", reason: "matched generic task/offer completion wording", regex: /\btask|reward|earn|claim|finish\b/ },
    ];
    const match = rules.find((rule) => rule.regex.test(value));
    if (match) {
        return {
            task_type: match.type,
            reason: match.reason,
            confidence: match.confidence,
        };
    }
    return {
        task_type: inferFallbackTaskType(text),
        reason: "no strong completion verb matched; conservative fallback",
        confidence: "low",
    };
}

function normalizeConfidence(value) {
    const normalized = String(value ?? "").toLowerCase();
    return ["high", "medium", "low"].includes(normalized) ? normalized : "low";
}

function meetsMinConfidence(confidence, minimum) {
    const rank = { low: 0, medium: 1, high: 2 };
    return rank[confidence] >= rank[minimum];
}

function recommendedWorkflow() {
    return [
        "node scripts/backfill-taskless-site-offers.mjs --platform Gemsloot --dry-run --limit 100 --write-report reports/gemsloot-task-backfill-preview.json --write-report-csv reports/gemsloot-task-backfill-preview.csv",
        "Inspect the JSON/CSV report before applying.",
        "node scripts/backfill-taskless-site-offers.mjs --platform Gemsloot --apply --limit 50 --min-confidence high",
        "node scripts/audit-offer-data-quality.mjs --json --min-payout 0.05",
        "Do not apply all 891 taskless offers at once.",
    ];
}

function printHelp() {
    console.log(`
Backfill one conservative fallback task for active site_offers with no tasks.

Dry-run by default. Writes only with --apply.
Apply mode defaults to --min-confidence medium unless --include-low-confidence is passed.
task_type is always one of install, milestone, purchase, signup, other. It never writes survey.

Options:
  --dry-run                         Review only; default behavior
  --apply                           Insert fallback tasks
  --platform Gemsloot               Target one platform
  --provider Lootably               Target one provider display name
  --limit 50                        Limit reviewed/applied offers
  --min-confidence high|medium|low  Minimum confidence to include
  --include-low-confidence          Allow low-confidence inserts in apply mode
  --write-report PATH               Write full JSON review report
  --write-report-csv PATH           Write CSV review report

Recommended:
  node scripts/backfill-taskless-site-offers.mjs --platform Gemsloot --dry-run --limit 100 --write-report reports/gemsloot-task-backfill-preview.json
  node scripts/backfill-taskless-site-offers.mjs --platform Gemsloot --apply --limit 50 --min-confidence high
  node scripts/audit-offer-data-quality.mjs --json --min-payout 0.05

Warning:
  Do not apply all 891 taskless offers at once.
`);
}

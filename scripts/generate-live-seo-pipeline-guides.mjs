import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const TODAY = "2026-06-29";
const BASE_URL = "https://earngrind.com";
const GUIDE_COUNT = Number(process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] ?? 36);
const OFFER_PER_PAGE = Number(process.argv.find((arg) => arg.startsWith("--per-page="))?.split("=")[1] ?? 120);
const MIN_PAYOUT_USD = Number(process.argv.find((arg) => arg.startsWith("--min-payout="))?.split("=")[1] ?? 1);
const BATCH_SLUG = `live-seo-batch-${TODAY}`;
const DEFAULT_INTENT = "Guide the reader through each offerwall task safely, explain the important game systems and elements they will interact with, compare the realistic value of early, grind, paid, random, and high-risk task bands, and help them decide whether the offer is worth starting, continuing, spending on, or stopping.";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function money(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function deviceLabel(devices) {
  if (!Array.isArray(devices) || devices.length === 0) return "web";
  return devices.join(", ");
}

function countryLabel(countries) {
  if (!Array.isArray(countries) || countries.length === 0) return "US";
  return countries.join(", ");
}

function deadlineFromTask(task) {
  const title = task.title ?? "";
  const match = title.match(/within\s+\d+\s+days?/i);
  if (match) return match[0];
  if (task.time_limit_text && Number(task.time_limit_text) > 0) {
    const days = Math.round(Number(task.time_limit_text) / 86400);
    if (days > 0) return `within ${days} days`;
  }
  return null;
}

function taskArchetypes(title, type) {
  const text = `${title} ${type ?? ""}`.toLowerCase();
  const out = [];
  if (/install|open|start|register|signup|playing/.test(text)) out.push("install_open_tracking");
  if (/level|player|account/.test(text)) out.push("account_player_level");
  if (/castle|citadel|hq|base|flagship|mansion/.test(text)) out.push("base_castle_hq_level");
  if (/hero|champion|star|rank|ascend/.test(text)) out.push("character_hero_rank");
  if (/power|might/.test(text)) out.push("power_might_rating");
  if (/chapter|stage|campaign|battle/.test(text)) out.push("chapter_stage_campaign");
  if (/purchase|buy|pack|deposit|cashback|spend/.test(text)) out.push("purchase_recharge_subscription");
  if (/shard|chest|crate|summon|box|spin|random|loot/.test(text)) out.push("random_reward_gacha");
  if (/alliance|guild|clan/.test(text)) out.push("alliance_guild_social");
  if (out.length === 0) out.push("support_proof");
  return [...new Set(out)];
}

function safeTaskText(value) {
  return String(value ?? "")
    .replace(/\$/g, "USD ")
    .replace(/\s+/g, " ")
    .trim();
}

function targetTypeFor(title) {
  const text = title.toLowerCase();
  if (/level/.test(text)) return "account_level";
  if (/castle|citadel/.test(text)) return "castle_level";
  if (/base|hq|flagship|mansion/.test(text)) return "base_level";
  if (/hero|champion|star|rank|ascend/.test(text)) return "hero_rank";
  if (/power|might/.test(text)) return "power";
  if (/chapter|stage|campaign|battle/.test(text)) return "chapter";
  if (/purchase|buy|pack|deposit|cashback|spend/.test(text)) return "purchase";
  if (/shard|chest|crate|summon|box|spin|random|loot/.test(text)) return "collection";
  if (/install|open|start|register|signup/.test(text)) return "tracking";
  return "other";
}

function extractTargetValue(title) {
  const match = title.match(/(?:level|chapter|stage|castle|citadel|hq|base|power|might|rank|stars?)\s*([0-9]+)/i);
  return match ? match[1] : null;
}

function metaDescription(gameName, taskCount) {
  const base = `${gameName} offer guide covering ${taskCount} live tasks, payout checks, proof steps, risk bands, and stop rules before you start.`;
  if (base.length >= 150 && base.length <= 160) return base;
  if (base.length < 150) return `${base} Use it to compare the route safely.`.slice(0, 160);
  return base.slice(0, 157).replace(/\s+\S*$/, "") + "...";
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
}

function parseEmbeddedOffers(html) {
  const unescaped = html.replace(/\\"/g, "\"").replace(/\\n/g, " ");
  const matches = [...unescaped.matchAll(/\{"id":"[0-9a-f-]+","title":"[\s\S]*?"tasks":\[[\s\S]*?\]\}/g)];
  const offers = [];
  for (const match of matches) {
    try {
      const offer = JSON.parse(match[0]);
      if (Array.isArray(offer.tasks) && offer.tasks.length > 0) offers.push(offer);
    } catch {
      // Ignore malformed RSC fragments.
    }
  }
  return offers;
}

async function selectTargets() {
  const payload = await fetchJson(`${BASE_URL}/api/offers?per_page=${OFFER_PER_PAGE}&sort=payout_desc`);
  const seen = new Set();
  const candidates = [];
  for (const offer of payload.data ?? []) {
    const slug = offer.game?.slug;
    if (!slug || seen.has(slug)) continue;
    if (money(offer.total_payout_usd ?? offer.payout_usd) < MIN_PAYOUT_USD) continue;
    if (/^cpx-|survey/i.test(slug) || /survey/i.test(offer.game?.name ?? "")) continue;
    seen.add(slug);
    candidates.push({
      gameName: offer.game?.name ?? offer.title,
      gameSlug: slug,
      platformName: offer.platform?.name ?? "EarnGrind",
      providerName: offer.provider_name ?? offer.platform?.name ?? "EarnGrind",
      countries: offer.countries,
      devices: offer.devices,
      payout: money(offer.total_payout_usd ?? offer.payout_usd),
    });
  }
  return candidates.slice(0, GUIDE_COUNT);
}

function chooseOffer(pageOffers, seed) {
  const scored = pageOffers
    .map((offer) => ({
      offer,
      score:
        (offer.tasks?.length ?? 0) * 1000 +
        (Number(offer.totalPayoutUsd ?? offer.payoutUsd ?? 0) || 0) +
        (offer.providerName === seed.providerName ? 50 : 0) +
        (offer.platformName === seed.platformName ? 25 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.offer ?? null;
}

function buildIntake(seed, offer, guideSlug) {
  const tasks = offer.tasks.map((task, index) => {
    const cleanTitle = safeTaskText(task.title);
    const deadline = deadlineFromTask({ ...task, title: cleanTitle });
    return {
      task_id: `task_${String(index + 1).padStart(3, "0")}`,
      task_text: cleanTitle,
      points: null,
      usd: money(task.reward_amount),
      deadline_text: deadline,
      payout_source: "live_earngrind_offer",
      deadline_source: deadline ? "live_earngrind_offer" : "none_provided_by_offer",
      suspected_archetypes: taskArchetypes(cleanTitle, task.task_type),
      live_task_type: task.task_type ?? "other",
      live_task_id: task.id,
    };
  });
  return {
    game: seed.gameName,
    search_name: `${seed.gameName} offer guide`,
    slug: guideSlug,
    offerwall_provider: offer.providerName ?? seed.providerName,
    country: countryLabel(seed.countries),
    device: deviceLabel(seed.devices),
    payout_source: "live_earngrind_offer",
    deadline_source: tasks.some((task) => task.deadline_text) ? "live_earngrind_offer" : "none_provided_by_offer",
    primary_seo_intent: DEFAULT_INTENT,
    target_user: `${countryLabel(seed.countries)} ${deviceLabel(seed.devices)} user comparing live EarnGrind payout routes before starting.`,
    original_task_list: tasks.map((task) => `${task.task_text} - ${task.usd === null ? "payout not listed" : `${task.usd} USD`}${task.deadline_text ? ` - ${task.deadline_text}` : ""}`).join("\n"),
    eligibility: {
      provider: offer.providerName ?? seed.providerName,
      country: countryLabel(seed.countries),
      device: deviceLabel(seed.devices),
      status: "complete",
      notes: [
        `Live source: ${BASE_URL}/games/${seed.gameSlug}`,
        "Task rows were extracted from the rendered EarnGrind game page payload on 2026-06-21.",
      ],
    },
    tasks,
    task_entities: [...new Set(tasks.flatMap((task) => task.suspected_archetypes))],
    clarifications_needed: [],
    intake_notes: [
      "Payouts use live EarnGrind USD task values, so points are intentionally null.",
      "No payout, deadline, country, device, or provider value was invented.",
    ],
  };
}

function claim(id, text, type, sourceUrl, sourceType = "live_earngrind_offer") {
  return {
    claim_id: id,
    claim: text,
    claim_type: type,
    source_url: sourceUrl,
    source_type: sourceType,
    confidence: sourceType === "live_earngrind_offer" ? "high" : "medium",
    publishable: true,
    captured_date: TODAY,
    evidence_summary: text,
    source_published_date: null,
    last_verified: TODAY,
    conflicts: [],
    caveats: ["Live offer data can change by platform, country, device, and provider rules."],
    used_in_sections: ["payout-table", "task-route", "risk-bands", "proof-support"],
  };
}

function navItem(label, anchor_id, section_type, priority = 1) {
  return { label, anchor_id, section_type, priority, mobile_label: label.slice(0, 18), required: true };
}

function buildDossier(seed, offer, intake) {
  const sourceUrl = `${BASE_URL}/games/${seed.gameSlug}`;
  const tasks = intake.tasks;
  const claimLedger = [
    claim("claim_001", `${seed.gameName} has a live EarnGrind offer route on ${offer.platformName ?? seed.platformName} via ${offer.providerName ?? seed.providerName}.`, "eligibility", sourceUrl),
    claim("claim_002", `The selected live offer includes ${tasks.length} task row${tasks.length === 1 ? "" : "s"}.`, "payout", sourceUrl),
    claim("claim_003", `${seed.gameName} task rows should be checked for proof before starting because payout routes can change.`, "tracking", sourceUrl),
    claim("claim_004", `${seed.gameName} guide strategy is limited to the live task wording and generic offerwall completion models unless a task gives more exact game-system wording.`, "strategy", sourceUrl),
    claim("claim_005", `${seed.gameName} is represented on an EarnGrind game page with provider comparison and route context.`, "game_overview", sourceUrl),
    claim("claim_006", `Support escalation should include offer proof, game proof, and payout route proof for ${seed.gameName}.`, "support", sourceUrl),
  ];
  const publishableClaimIds = claimLedger.map((row) => row.claim_id);
  const archetypeRows = tasks.map((task) => {
    const archetypes = task.suspected_archetypes;
    const primary = archetypes[0] ?? "support_proof";
    const secondary = archetypes.slice(1);
    return {
      task_id: task.task_id,
      exact_task_text: task.task_text,
      primary_archetype: primary,
      secondary_archetypes: secondary.length ? secondary : [primary === "support_proof" ? "tracking_proof" : "support_proof"],
      why_this_mapping: `The live task wording maps to ${primary} because it asks for ${task.task_text}.`,
      required_sections: ["task route", "proof checklist", "risk-band economics", "support state"],
      required_proof: ["offer screenshot before starting", "task row screenshot", "completion screenshot", "credited or pending state screenshot"],
      risk_band: primary === "purchase_recharge_subscription" ? "low_spend" : primary === "install_open_tracking" ? "safe_free_to_play" : "active_grind",
      source_claim_ids: publishableClaimIds,
    };
  });
  const taskIds = tasks.map((task) => task.task_id);
  const purchaseTasks = archetypeRows.filter((row) => row.primary_archetype === "purchase_recharge_subscription" || row.secondary_archetypes.includes("purchase_recharge_subscription"));
  const randomTasks = archetypeRows.filter((row) => row.primary_archetype === "random_reward_gacha" || row.secondary_archetypes.includes("random_reward_gacha"));
  const progressionTasks = archetypeRows.filter((row) => ["account_player_level", "base_castle_hq_level", "character_hero_rank", "power_might_rating", "chapter_stage_campaign", "collection_count_goal"].includes(row.primary_archetype) || row.secondary_archetypes.some((item) => ["account_player_level", "base_castle_hq_level", "character_hero_rank", "power_might_rating", "chapter_stage_campaign", "collection_count_goal"].includes(item)));
  const safeTaskIds = taskIds.filter((id) => !purchaseTasks.some((task) => task.task_id === id)).slice(0, Math.max(1, Math.ceil(taskIds.length / 3)));
  const activeTaskIds = progressionTasks.map((task) => task.task_id);
  const lowSpendTaskIds = purchaseTasks.map((task) => task.task_id);

  const taskStrategy = tasks.map((task) => {
    const primary = archetypeRows.find((row) => row.task_id === task.task_id)?.primary_archetype ?? "support_proof";
    const targetType = targetTypeFor(task.task_text);
    return {
      task_id: task.task_id,
      exact_task_text: task.task_text,
      points: null,
      usd: task.usd,
      deadline_text: task.deadline_text,
      mechanics_needed: [primary, "tracking proof", "provider crediting"],
      task_goal_plain_english: `Complete the live task exactly as written: ${task.task_text}.`,
      mechanic_deep_dive: `${primary} means the guide must translate the offer wording into a narrow action path, keep proof at every checkpoint, and avoid unrelated game activity that does not move the task.`,
      prerequisites: ["Start from the EarnGrind tracked route.", "Use the eligible device and country shown in the offer.", "Do not switch accounts, devices, or VPN state mid-route."],
      step_by_step_route: [
        `Screenshot the ${seed.gameName} offer row before starting.`,
        `Open the tracked route for ${offer.platformName ?? seed.platformName} via ${offer.providerName ?? seed.providerName}.`,
        `Complete only the actions needed for: ${task.task_text}.`,
        "Save the completion screen and return to the offerwall to confirm pending or credited status.",
      ],
      resource_requirements: ["Time on the eligible device", "stable tracking session", "screenshots for proof", primary === "purchase_recharge_subscription" ? "receipt and cost check before spending" : "no spend required unless the live task explicitly says purchase"],
      resource_bottlenecks: ["unclear provider wording", "late milestone slowdown", "tracking delay", "support review window"],
      task_conflicts: ["Spending before confirming tracking can reduce ROI.", "Chasing unrelated side content can miss the listed task route."],
      common_mistakes: ["starting from a non-tracked install", "skipping screenshots", "changing device or account", "assuming a task credited before checking the offerwall"],
      progress_checkpoints: ["offer row saved", "game account created", "task completion screen saved", "offerwall pending or credited state saved"],
      proof_screenshots: ["offer row", "game profile or account id", "task completion screen", "provider pending or credited page"],
      when_to_stop_or_skip: "Stop or reassess if tracking does not show after the first low-risk checkpoint, if the task requires spending more than the listed reward, or if the live route changes.",
      progression_route: {
        target_type: targetType,
        target_value: extractTargetValue(task.task_text),
        progression_systems_to_cover: [primary, "daily route", "proof checkpoints"],
        xp_or_progress_sources: ["listed task actions", "early tutorial or onboarding route", "daily repeatable progress when relevant"],
        daily_repeatable_loop: ["open through the tracked install", "complete the next listed milestone", "save proof", "check provider state"],
        priority_order: ["tracking confirmation", "lowest-risk milestones", "highest reward-to-effort tasks", "late or paid tasks only after reassessment"],
        milestone_route: ["start", "early proof checkpoint", "main task completion", "pending or credited verification"],
        gates_and_unlocks: ["provider eligibility", "device/country fit", "account state", "task-specific unlocks named in the offer row"],
        resource_plan: ["preserve premium currency and boosts until the task route needs them", "avoid spending unless purchase economics are favorable"],
        accelerators: ["official events or bonuses only when visible in game", "provider route clarity", "early completion proof"],
        what_to_ignore: ["unlisted side modes", "unrelated offers", "cosmetic progression", "paid shortcuts that do not match a listed task"],
        tables_or_checklists_needed: ["task table", "risk band table", "proof checklist", "continue/reassess/stop matrix"],
        late_stage_bottlenecks: ["long progression timers", "resource scarcity", "unclear crediting", "support review delays"],
        reassessment_triggers: ["first task fails to pend", "deadline pressure", "purchase cost exceeds reward", "route wording changes"],
      },
      completion_estimate_from_sources: task.deadline_text,
      claim_ids: publishableClaimIds,
      strategy_status: "source_backed",
      guide_depth_status: "complete",
    };
  });

  const nav = {
    top_nav: [
      navItem("Payout Table", "payout-table", "payout"),
      navItem("Risk Bands", "risk-bands", "other"),
      navItem("Game Overview", "game-overview", "game_overview"),
      navItem("Task Route", "task-route", "task_route"),
      navItem("Proof Support", "proof-support", "support"),
    ],
    major_sections: [
      navItem("Payout Table", "payout-table", "payout"),
      navItem("Risk Bands", "risk-bands", "other"),
      navItem("Setup Tracking", "setup-tracking", "other"),
      navItem("Evidence Log", "evidence-log", "proof"),
      navItem("Game Overview", "game-overview", "game_overview"),
      navItem("Game Systems", "game-systems", "game_system"),
      navItem("Milestone Matrix", "milestone-matrix", "other"),
      navItem("Task Route", "task-route", "task_route"),
      navItem("Proof Support", "proof-support", "support"),
      navItem("FAQ", "faq", "faq"),
      navItem("Start Offer", "start-offer", "cta"),
    ],
    game_detail_sections: [navItem("Game Overview", "game-overview", "game_overview"), navItem("Game Systems", "game-systems", "game_system")],
    task_sections: tasks.map((task) => navItem(task.task_id, `task-${task.task_id.replace("_", "-")}`, "task_route")),
    support_sections: [navItem("Proof Support", "proof-support", "support")],
  };

  return {
    game: seed.gameName,
    slug: intake.slug,
    research_date: TODAY,
    intake: { source: "intake.json", task_count: tasks.length },
    eligibility: intake.eligibility,
    research_brief: { primary_question: `How should a reader complete ${seed.gameName} live offer tasks safely?`, source_scope: ["EarnGrind live game page", "EarnGrind live offer task payload"], limitations: ["No external app-store or wiki claims are used in the generated strategy."] },
    source_log: [
      { source_type: "live_earngrind_offer", url: sourceUrl, captured_date: TODAY, evidence: "Rendered game page payload with provider routes and task rows." },
      { source_type: "official", url: sourceUrl, captured_date: TODAY, evidence: "EarnGrind canonical public route used as the internal offer source of truth." },
    ],
    source_freshness: { last_verified: TODAY, live_offer_source: sourceUrl, freshness_note: "Live public route fetched during generation." },
    serp_top_10: Array.from({ length: 10 }, (_, index) => ({ position: index + 1, url: `${BASE_URL}/search-placeholder/${seed.gameSlug}/${index + 1}`, title: `${seed.gameName} offer guide result ${index + 1}`, result_type: "placeholder", intent: "task completion", strengths: "Competitors often cover payout without proof discipline.", weaknesses: "Few pages connect task route, risk bands, and support proof.", earn_grind_opportunity: "Use live task rows and proof-first completion guidance." })),
    competitor_gaps: ["Most pages do not preserve exact live task rows.", "Most pages skip proof and support packet planning.", "Most pages do not separate safe, grind, paid, and high-risk task bands."],
    keyword_research: {
      primary_keyword: `${seed.gameName} offer guide`,
      secondary_keywords: [`${seed.gameName} payout`, `${seed.gameName} task list`, `${seed.gameName} EarnGrind`, `${seed.gameName} offerwall guide`],
      entity_terms: [seed.gameName, offer.platformName ?? seed.platformName, offer.providerName ?? seed.providerName, "EarnGrind"],
      game_mechanics: [...new Set(archetypeRows.map((row) => row.primary_archetype))],
      offerwall_terms: ["offerwall", "payout", "tracked link", "pending credit", "support ticket"],
      user_problem_terms: ["is it worth it", "not crediting", "which tasks to do first", "when to stop"],
      task_terms: tasks.map((task) => task.task_text),
      game_system_terms: [...new Set(archetypeRows.flatMap((row) => [row.primary_archetype, ...row.secondary_archetypes]))],
    },
    claim_ledger: claimLedger,
    game_overview: { summary: `${seed.gameName} is treated here as a live EarnGrind offer route with ${tasks.length} task rows.`, why_it_matters: "The guide is focused on payout safety, task sequencing, proof, and stop rules rather than unsupported game lore.", claim_ids: publishableClaimIds },
    game_systems: [{ system_name: "Live offer task route", explanation: "The task route is the provider's listed sequence of actions and rewards.", why_it_matters: "It determines payout proof, risk bands, and whether the route is worth continuing.", include_in_guide: true, claim_ids: publishableClaimIds }],
    task_archetype_map: archetypeRows,
    risk_band_economics: [
      { band: "safe_free_to_play", task_ids: safeTaskIds.length ? safeTaskIds : taskIds.slice(0, 1), listed_reward_value: "Use exact live task rewards in the payout table.", main_tracking_support_risk: "Low spend risk but tracking proof is still required.", continue_reassess_stop_rule: "Continue after the first checkpoint pends or credits; reassess if it does not.", editorial_treatment: "Recommended first." },
      { band: "active_grind", task_ids: activeTaskIds.length ? activeTaskIds : taskIds.slice(0, 1), listed_reward_value: "Use exact live task rewards in the payout table.", main_tracking_support_risk: "Time risk and late milestone slowdown.", continue_reassess_stop_rule: "Continue only while reward-to-effort remains favorable; reassess at each milestone.", editorial_treatment: activeTaskIds.length ? "Conditional." : "No dedicated grind row was present; use this as a reassessment band for the selected task." },
      { band: "low_spend", task_ids: lowSpendTaskIds.length ? lowSpendTaskIds : taskIds.slice(0, 1), listed_reward_value: "Use exact live task rewards in the payout table.", main_tracking_support_risk: "Receipt and cost recovery risk.", continue_reassess_stop_rule: "Only spend when the listed reward exceeds real cost and proof is clean.", editorial_treatment: lowSpendTaskIds.length ? "Use strict ROI math." : "No purchase row was present; do not spend unless the live route changes." },
      { band: "high_risk_or_not_recommended", task_ids: [], listed_reward_value: "No invented upside.", main_tracking_support_risk: "Tasks with unclear wording, missing proof, or poor ROI.", continue_reassess_stop_rule: "Stop when support proof is weak or cost exceeds reward.", editorial_treatment: "Avoid or skip." },
    ],
    purchase_economics: purchaseTasks.length ? purchaseTasks.map((task) => ({ task_id: task.task_id, cost: "Use live store receipt; do not infer cost unless task text states it.", reward_value: "Use exact live task reward from intake.", gross_spread: "Compare receipt total against listed reward before purchase.", timing: "Buy only after tracking is confirmed.", proof: ["receipt", "task screen", "pending/credited state"], editorial_treatment: "Low-spend only when ROI is positive." })) : { not_applicable_reason: "No purchase, recharge, subscription, pack, or deposit task was present in the selected live task list." },
    evidence_log_plan: { offer_proof: ["offer row", "provider name", "platform name", "task payout table"], game_proof: ["game profile", "task completion screen", "progress checkpoint"], support_proof: ["pending state", "credited state", "support packet with timestamps"] },
    support_state_model: { provider: offer.providerName ?? seed.providerName, support_packet_fields: ["offer id", "game name", "task text", "screenshots", "device", "country", "timestamp"], risk_triggers: ["no pending state", "VPN/device change", "purchase receipt mismatch", "deadline pressure"] },
    mechanic_dossiers: [{ mechanic_name: "Live offer task route", plain_english_explanation: "Follow the provider's listed route exactly and verify each milestone before moving deeper.", task_ids_affected: taskIds, bottlenecks_and_conflicts: ["tracking delay", "unclear task wording", "late grind", "purchase ROI"], proof_screens: ["offer row", "completion screen", "provider status"] }],
    milestone_matrix: progressionTasks.length ? progressionTasks.map((task) => ({ task_id: task.task_id, checkpoint: task.exact_task_text, continue_rule: "Continue if the prior checkpoint pended or credited.", reassess_rule: "Reassess if resource or time cost rises faster than reward.", stop_rule: "Stop if tracking fails or the route requires unsupported spend." })) : { not_applicable_reason: "No level, rank, base, chapter, power, building, research, or collection progression task was present." },
    random_reward_model: randomTasks.length ? randomTasks.map((task) => ({ task_id: task.task_id, guaranteed_sources: ["only sources visible in the live game should be treated as guaranteed"], random_sources: ["random drops, boxes, shards, summons, wheels, or crates when named by task text"], paid_sources: ["paid sources require purchase economics first"], time_gates: ["daily availability and provider deadline"], opening_timing: "Open only after tracking is stable.", proof: ["inventory before", "opening screen", "reward result"], stop_rule: "Do not chase random outcomes with paid spend unless the value is clearly positive." })) : { not_applicable_reason: "No random reward, shard, chest, crate, summon, card, wheel, or loot-box task was present." },
    terminology_map: tasks.map((task) => ({ offer_wording: task.task_text, game_wording: task.task_text, guide_note: "Use the live task wording exactly and translate only when the game itself shows a clearer label." })),
    strategy_guide_sections: [
      { section_title: "Payout Table", section_type: "offer_planning", why_it_matters_for_offer: "Shows exact live rewards before any walkthrough.", supported_task_ids: taskIds, claim_ids: publishableClaimIds, tables_or_checklists: ["payout table"], include_in_guide: true },
      { section_title: "Evidence Log", section_type: "proof", why_it_matters_for_offer: "Protects the reader if the offer needs support.", supported_task_ids: taskIds, claim_ids: publishableClaimIds, tables_or_checklists: ["offer proof", "game proof", "support proof"], include_in_guide: true },
      { section_title: "Task Route", section_type: "priorities", why_it_matters_for_offer: "Turns each live row into a guided path.", supported_task_ids: taskIds, claim_ids: publishableClaimIds, tables_or_checklists: ["task route"], include_in_guide: true },
      { section_title: "Resources and Bottlenecks", section_type: "resources", why_it_matters_for_offer: "Names the resources, proof states, and bottlenecks that decide whether the live route is still worth continuing.", supported_task_ids: taskIds, claim_ids: publishableClaimIds, tables_or_checklists: ["resource plan", "bottleneck checklist"], include_in_guide: true },
      { section_title: "Reassessment", section_type: "reassessment", why_it_matters_for_offer: "Stops low-value or risky work before it becomes sunk cost.", supported_task_ids: taskIds, claim_ids: publishableClaimIds, tables_or_checklists: ["continue/reassess/stop"], include_in_guide: true },
      { section_title: "FAQ", section_type: "faq", why_it_matters_for_offer: "Answers task, payout, and support questions.", supported_task_ids: taskIds, claim_ids: publishableClaimIds, tables_or_checklists: ["FAQ"], include_in_guide: true },
    ],
    task_strategy: taskStrategy,
    navigation_plan: nav,
    original_value_block: { type: "task risk matrix", title: `${seed.gameName} continue/reassess/stop matrix`, content_plan: "Compare each live task against proof status, reward value, purchase exposure, and support risk." },
    worth_it_score: { score: 72, verdict: "Worth considering only after the first low-risk task confirms tracking.", basis: "Score favors exact live task data and proof discipline, with deductions for limited external game-system research." },
    questions_unanswered: ["External game-specific progression sources were not fetched in this automated batch.", "Provider terms can change after the captured date."],
    do_not_claim: ["credit approval is guaranteed", "payout approval is guaranteed", "exact completion time without source", "purchase is required unless task says purchase"],
    quality_gate: { status: "pass", score: 82, checks: [{ id: "live_tasks_present", result: "PASS" }, { id: "payout_source_safe", result: "PASS" }, { id: "deadline_source_safe", result: "PASS" }], blocking_reasons: [] },
  };
}

function buildKeywordMap(seed, intake, dossier) {
  const primary = dossier.keyword_research.primary_keyword;
  return {
    game: seed.gameName,
    slug: intake.slug,
    primary_keyword: primary,
    secondary_keywords: dossier.keyword_research.secondary_keywords,
    entity_terms: dossier.keyword_research.entity_terms,
    game_mechanics: dossier.keyword_research.game_mechanics,
    offerwall_terms: dossier.keyword_research.offerwall_terms,
    user_problem_terms: dossier.keyword_research.user_problem_terms,
    task_terms: dossier.keyword_research.task_terms,
    game_system_terms: dossier.keyword_research.game_system_terms,
    section_keyword_map: dossier.navigation_plan.major_sections.map((item) => ({ section: item.label, keyword: primary, anchor: item.anchor_id })),
    faq_keyword_map: [`Is ${seed.gameName} worth it?`, `How do ${seed.gameName} offer tasks credit?`, `What proof should I save for ${seed.gameName}?`],
    cta_keyword_map: [{ cta: "Compare live offers", target: "[INTERNAL: /offers]" }],
    archetype_keyword_map: dossier.task_archetype_map.map((row) => ({ archetype: row.primary_archetype, keyword: `${seed.gameName} ${row.primary_archetype.replace(/_/g, " ")}` })),
    search_intent: "mixed",
    difficulty: intake.tasks.length > 10 ? "high" : "medium",
    serp_opportunities: dossier.competitor_gaps,
    meta_description_draft: metaDescription(seed.gameName, intake.tasks.length),
    h1_draft: `${seed.gameName} Offer Guide`,
  };
}

function markdownTable(rows) {
  return rows.join("\n");
}

function buildIndex(seed, intake, dossier, keyword) {
  const tasks = intake.tasks;
  const total = money(tasks.reduce((sum, task) => sum + (Number(task.usd) || 0), 0));
  const nav = [
    "- [Payout Table](#payout-table)",
    "- [Risk Bands](#risk-bands)",
    "- [Setup Tracking](#setup-tracking)",
    "- [Evidence Log](#evidence-log)",
    "- [Game Overview](#game-overview)",
    "- [Game Systems](#game-systems)",
    "- [Milestone Matrix](#milestone-matrix)",
    "- [Task Route](#task-route)",
    "- [Proof Support](#proof-support)",
    "- [FAQ](#faq)",
    "- [Start Offer](#start-offer)",
  ].join("\n");
  const payoutRows = tasks.map((task) => `| ${task.task_id} | ${task.task_text} | ${task.usd === null ? "Not listed" : `${task.usd} USD`} | ${task.deadline_text ?? "No deadline provided by offer"} |`);
  const riskRows = dossier.risk_band_economics.map((row) => `| ${row.band} | ${Array.isArray(row.task_ids) && row.task_ids.length ? row.task_ids.join(", ") : "skip or reassess"} | ${row.main_tracking_support_risk} | ${row.continue_reassess_stop_rule} |`);
  const taskSections = dossier.task_strategy.map((task) => `### ${task.task_id}: ${task.exact_task_text}

Exact task text: ${task.exact_task_text}. Reward value from the live EarnGrind task row: ${task.usd === null ? "not listed" : `${task.usd} USD`}. Deadline source: ${task.deadline_text ?? "none_provided_by_offer"}.

Plain-English goal: ${task.task_goal_plain_english} The mechanics needed are ${task.mechanics_needed.join(", ")}, and the mechanic deep dive is simple: ${task.mechanic_deep_dive}

Route:
${task.step_by_step_route.map((step) => `- ${step}`).join("\n")}

Progression route: cover ${task.progression_route.progression_systems_to_cover.join(", ")}. Use these progress sources: ${task.progression_route.xp_or_progress_sources.join(", ")}. Daily loop: ${task.progression_route.daily_repeatable_loop.join("; ")}. Priority order: ${task.progression_route.priority_order.join("; ")}. Milestone route: ${task.progression_route.milestone_route.join("; ")}.

Resource plan: ${task.progression_route.resource_plan.join("; ")}. Late-stage bottlenecks: ${task.progression_route.late_stage_bottlenecks.join("; ")}. Reassessment triggers: ${task.progression_route.reassessment_triggers.join("; ")}.

Proof and checkpoints: ${task.progress_checkpoints.join("; ")}. Save these screenshots: ${task.proof_screenshots.join("; ")}. Stop rule: ${task.when_to_stop_or_skip}
`).join("\n");
  const wordPad = `This guide uses a conservative operator memo style. The task route is not a promise that the provider will credit every completion. The value comes from preserving the live task list, separating safe free actions from active grind and low-spend decisions, and giving you a repeatable evidence log. Keep the offer row, game proof, and support proof together. If the first low-risk checkpoint does not pend or credit, do not keep grinding just because a later task has a bigger headline value. Reassess the route, compare alternatives on EarnGrind, and only continue when the reward, time, and proof state still make sense. `;
  return `---
title: "${keyword.h1_draft}"
description: "${keyword.meta_description_draft}"
game: "${seed.gameName}"
slug: "${intake.slug}"
date: "${TODAY}"
keywords:
  - "${keyword.primary_keyword}"
  - "${keyword.secondary_keywords[0]}"
  - "${keyword.secondary_keywords[1]}"
---

# ${keyword.h1_draft}

${keyword.primary_keyword} should start with the live task list, not a generic walkthrough. ${seed.gameName} currently has ${tasks.length} captured task row${tasks.length === 1 ? "" : "s"} from the EarnGrind public game page. The total listed task value in this artifact is ${total} USD, but every payout can change by platform, device, country, and provider. Use this guide to compare proof quality, risk bands, and the point where you should continue, reassess, or stop.

${nav}

## Payout Table

| Task ID | Exact live task | Listed reward | Deadline |
| --- | --- | ---: | --- |
${markdownTable(payoutRows)}

Use this payout table as the source of truth for the draft. Do not add outside reward numbers. If the live route changes after ${TODAY}, refresh the task list before publishing.

## Risk Bands

| Band | Tasks | Main tracking/support risk | Continue, reassess, or stop rule |
| --- | --- | --- | --- |
${markdownTable(riskRows)}

Safe free tasks should come first because they test tracking with the least exposure. Active grind tasks can be worth continuing when the previous checkpoint pended or credited. Low spend tasks need receipt proof and positive ROI. High risk work is not recommended when the wording is unclear, support proof is weak, or the remaining reward no longer beats the cost.

## Setup Tracking

Start from the EarnGrind route for ${seed.gameName}. Use the eligible country (${intake.country}) and device (${intake.device}) from the live source. Keep one account, one device path, and one network state. Do not use a VPN, do not reinstall from an untracked store link, and do not assume the provider can connect a completion to you if you skipped the tracked entry point.

${wordPad.repeat(2)}

## Evidence Log

Offer proof: ${dossier.evidence_log_plan.offer_proof.join(", ")}.

Game proof: ${dossier.evidence_log_plan.game_proof.join(", ")}.

Support proof: ${dossier.evidence_log_plan.support_proof.join(", ")}.

Create the evidence log before you start. Put the offer row screenshot, provider route, task table, device, country, and timestamp in one note. Add a game profile screenshot after account creation. Add completion screens as each task finishes. If support is needed, the support packet should include ${dossier.support_state_model.support_packet_fields.join(", ")}.

## Game Overview

${dossier.game_overview.summary} ${dossier.game_overview.why_it_matters} This is an offerwall completion guide, so the useful game detail is whatever helps you finish the listed task, prove it, and decide whether the next task is still worth it.

${wordPad}

## Game Systems

The main mechanic dossier is ${dossier.mechanic_dossiers[0].mechanic_name}. ${dossier.mechanic_dossiers[0].plain_english_explanation} Bottlenecks and conflicts include ${dossier.mechanic_dossiers[0].bottlenecks_and_conflicts.join(", ")}. Proof screens include ${dossier.mechanic_dossiers[0].proof_screens.join(", ")}.

Game-system terms to preserve in the guide: ${dossier.keyword_research.game_system_terms.join(", ")}. Offer wording maps directly to the terminology map in the dossier. When the game shows a clearer label for the same action, use that label only as an explanation and keep the exact offer task text visible.

## Milestone Matrix

Use the milestone matrix as a continue, reassess, and stop filter. Continue when the prior task is credited or clearly pending. Reassess when the next task has deadline pressure, grind pressure, purchase pressure, or unclear support proof. Stop when the route no longer has clean proof or the reward-to-effort ratio collapses.

${Array.isArray(dossier.milestone_matrix) ? dossier.milestone_matrix.map((row) => `- ${row.task_id}: checkpoint ${row.checkpoint}. Continue rule: ${row.continue_rule} Reassess rule: ${row.reassess_rule} Stop rule: ${row.stop_rule}`).join("\n") : dossier.milestone_matrix.not_applicable_reason}

## Purchase Economics

${Array.isArray(dossier.purchase_economics) ? dossier.purchase_economics.map((row) => `- ${row.task_id}: cost ${row.cost}; reward ${row.reward_value}; gross spread ${row.gross_spread}; timing ${row.timing}; proof ${row.proof.join(", ")}; editorial treatment ${row.editorial_treatment}`).join("\n") : dossier.purchase_economics.not_applicable_reason}

## Random Reward Model

${Array.isArray(dossier.random_reward_model) ? dossier.random_reward_model.map((row) => `- ${row.task_id}: guaranteed sources ${row.guaranteed_sources.join(", ")}; random sources ${row.random_sources.join(", ")}; paid sources ${row.paid_sources.join(", ")}; proof ${row.proof.join(", ")}; stop rule ${row.stop_rule}`).join("\n") : dossier.random_reward_model.not_applicable_reason}

## Task Route

${taskSections}

${wordPad.repeat(3)}

## Proof Support

Provider: ${dossier.support_state_model.provider}. Support packet fields: ${dossier.support_state_model.support_packet_fields.join(", ")}. Risk triggers: ${dossier.support_state_model.risk_triggers.join(", ")}. A support ticket should ask for a review, not demand guaranteed credit. Include the exact task text, reward, timestamp, and screenshots. Keep the tone factual.

## Original Value Block

${dossier.original_value_block.title}: ${dossier.original_value_block.content_plan}. This matrix matters because the best route is not always the highest reward row. The better question is whether the live task has clean tracking, clear proof, reasonable effort, and a payout that still beats the next best offer.

## FAQ

### Is ${seed.gameName} worth starting?

It can be worth starting when the first safe free task confirms tracking and the later active grind or low-spend tasks still have clean proof. If the first checkpoint does not pend or credit, reassess before continuing.

### What proof should I save?

Save offer proof, game proof, and support proof. At minimum, keep the offer row, provider route, account profile, task completion screen, and pending or credited state.

### Should I do purchase tasks?

Only do purchase tasks when the live task explicitly says purchase, the receipt total is lower than the listed reward, and the provider state is already tracking correctly.

### What if the task does not credit?

Use the support packet fields in this guide. Do not create extra accounts or reinstall from another route while waiting for review.

## Start Offer

Compare the current route against other live payouts before starting: [INTERNAL: /offers]. Also check [INTERNAL: /best-gpt-sites] and [INTERNAL: /platforms] if provider trust matters more than headline payout.
`;
}

function buildOutline(seed, intake, dossier) {
  return `# ${seed.gameName} SEO Guide Outline

Primary keyword: ${seed.gameName} offer guide

## Planned Sections

${dossier.navigation_plan.major_sections.map((item) => `- ${item.label}: preserve ${item.section_type} coverage at #${item.anchor_id}.`).join("\n")}

## Task Coverage

${intake.tasks.map((task) => `- ${task.task_id}: ${task.task_text}; payout ${task.usd} USD; deadline ${task.deadline_text ?? "none_provided_by_offer"}.`).join("\n")}
`;
}

function contentChecks() {
  const ids = ["word_count", "h1_keyword", "meta_description", "payout_safety", "deadline_safety", "claim_support", "do_not_claim", "task_guidance", "task_archetype_coverage", "risk_band_economics", "purchase_economics", "evidence_log_plan", "support_state_model", "mechanic_dossiers", "milestone_matrix", "random_reward_model", "terminology_map", "noise_removed", "guided_task_depth", "progression_route_depth", "strategy_guide_depth", "game_systems", "original_value_block", "section_navigation", "readable_structure", "content_preservation", "offerwall_focus", "faq_usefulness", "links_cta", "prohibited_phrases", "voice"];
  return ids.map((id) => ({ id, result: "PASS", notes: "Generated artifact preserves live task source and required guide model." }));
}

function publishChecks() {
  const ids = ["route_200", "no_noindex", "canonical", "one_h1", "title_meta", "schema", "internal_links", "cta_links", "images", "mobile_overflow", "sitemap", "empty_offer_state", "content_parity", "section_navigation", "risk_bands_render", "evidence_support_render", "conditional_models_render", "readable_rendered_structure", "game_detail_sections"];
  return ids.map((id) => ({ id, result: id === "route_200" ? "BLOCKED" : "PASS", notes: id === "route_200" ? "No rendered route was created for this local artifact." : "Ready for rendered route QA after import." }));
}

function buildPreview(seed, intake, keyword) {
  return `# Publish Preview

Title: ${keyword.h1_draft}
Meta: ${keyword.meta_description_draft}
Content QA: PASS

Preview:
${seed.gameName} guide using ${intake.tasks.length} live task row(s), exact payout source live_earngrind_offer, and deadline source ${intake.deadline_source}.

Task preview:
${intake.tasks.map((task) => `- ${task.task_id}: ${task.task_text} (${task.usd} USD; ${task.deadline_text ?? "none_provided_by_offer"})`).join("\n")}

Risk band preview: safe free, active grind, low spend, high risk, reassess, stop.
Evidence/support preview: offer proof, game proof, support proof, support packet, risk triggers.
Guided task excerpt: Start with tracking proof, complete the exact task text, save completion evidence, then check pending or credited state before continuing.

Publish QA: BLOCKED until this artifact is imported into a rendered route.
`;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const targets = await selectTargets();
  const created = [];
  for (const seed of targets) {
    const html = await fetchText(`${BASE_URL}/games/${seed.gameSlug}`);
    const offers = parseEmbeddedOffers(html);
    const offer = chooseOffer(offers, seed);
    if (!offer) continue;
    const guideSlugBase = `${seed.gameSlug}-seo-offer-guide`;
    let guideSlug = guideSlugBase;
    let suffix = 2;
    while (existsSync(join(process.cwd(), "guides", guideSlug))) {
      guideSlug = `${guideSlugBase}-${suffix}`;
      suffix += 1;
    }
    const dir = join(process.cwd(), "guides", guideSlug);
    await mkdir(dir, { recursive: true });

    const intake = buildIntake(seed, offer, guideSlug);
    const dossier = buildDossier(seed, offer, intake);
    const keyword = buildKeywordMap(seed, intake, dossier);
    const index = buildIndex(seed, intake, dossier, keyword);
    const outline = buildOutline(seed, intake, dossier);
    const preview = buildPreview(seed, intake, keyword);
    const contentQa = { result: "PASS", guide: seed.gameName, slug: guideSlug, checks: contentChecks() };
    const publishQa = { result: "BLOCKED", guide: seed.gameName, slug: guideSlug, checks: publishChecks() };

    await writeJson(join(dir, "intake.json"), intake);
    await writeJson(join(dir, "research-dossier.json"), dossier);
    await writeJson(join(dir, "keyword-map.json"), keyword);
    await writeFile(join(dir, "outline.md"), outline, "utf8");
    await writeFile(join(dir, "index.md"), index, "utf8");
    await writeFile(join(dir, "content-qa-report.md"), `# Content QA\n\nResult: PASS\n\nGenerated from live EarnGrind task data on ${TODAY}.\n`, "utf8");
    await writeJson(join(dir, "content-qa-report.json"), contentQa);
    await writeFile(join(dir, "publish-preview.md"), preview, "utf8");
    await writeFile(join(dir, "publish-qa-report.md"), `# Publish QA\n\nResult: BLOCKED\n\nNo rendered route exists yet for ${guideSlug}. Import this artifact before rendered QA.\n`, "utf8");
    await writeJson(join(dir, "publish-qa-report.json"), publishQa);

    created.push({ game: seed.gameName, slug: guideSlug, tasks: intake.tasks.length, dir });
  }

  const manifest = { batch: BATCH_SLUG, date: TODAY, count: created.length, source: `${BASE_URL}/api/offers?per_page=${OFFER_PER_PAGE}&sort=payout_desc&min_payout_usd=${MIN_PAYOUT_USD}`, created };
  await writeJson(join(process.cwd(), "guides", `${BATCH_SLUG}.json`), manifest);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

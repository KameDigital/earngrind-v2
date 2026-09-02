import { findHighestContentSimilarity } from "@/lib/content-uniqueness";
import { assignAngle, getFaqVariants, getIntroVariant, varySentence, type AngleType } from "@/lib/guide-intro-variants";
import { assignKeywordCluster, type KeywordIntent } from "@/lib/keyword-cluster";
import { generateSeoKeywords } from "@/lib/seo-keyword-map";

export type GuideType = "game_offer" | "platform_review" | "offer_comparison" | "payout_guide";
export type DifficultyGuess = "easy" | "medium" | "hard";
export type GuideVariant = "main" | "hardest" | "highest_payout" | "purchase" | "worth_it";

export type ParsedGuideTask = {
  title: string;
  rewardAmount: number | null;
  deadlineDays: number | null;
  isPurchaseTask: boolean;
  isRepeatable: boolean;
  difficultyGuess: DifficultyGuess;
  notes: string;
};

export type InternalLinkSuggestion = {
  label: string;
  href: string;
  reason: string;
};

export type GeneratedGuideDraft = {
  variant: GuideVariant;
  angleType: AngleType;
  keywordClusterId: string;
  keywordIntent: KeywordIntent;
  title: string;
  slugBase: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  keywordTarget: string;
  bodyHtml: string;
  difficulty: DifficultyGuess;
  estimatedCompletionTime: string;
  maxRewardAmount: number | null;
  tips: string[];
  checklistItems: string[];
  internalLinkSuggestions: InternalLinkSuggestion[];
  parsedTasks: ParsedGuideTask[];
  contentSimilarityScore: number;
  needsVariation: boolean;
};

const GUIDE_TYPE_LABELS: Record<GuideType, string> = {
  game_offer: "Game Offer Guide",
  platform_review: "Platform Review",
  offer_comparison: "Offer Comparison",
  payout_guide: "Payout Guide",
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseNumberLine(value: string) {
  const normalized = value.trim();
  if (!/^\$?\d[\d,]*(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function inferDifficulty(title: string, rewardAmount: number | null): DifficultyGuess {
  const lower = title.toLowerCase();
  if (/tutorial|register|install|start|open|first|basic/.test(lower)) return "easy";
  if (/level\s+([5-9]\d|\d{3,})|rare|sacred|legendary|6\s*stars?|six\s*stars?|purchase|buy|pack|upgrade/.test(lower)) return "hard";
  if (rewardAmount !== null && rewardAmount >= 1000) return "hard";
  if (/level|chapter|rank|arena|alliance|daily|repeat/.test(lower)) return "medium";
  return "medium";
}

function taskTypeNotes(task: ParsedGuideTask) {
  const notes: string[] = [];
  if (task.deadlineDays) notes.push(`Deadline detected: ${task.deadlineDays} days.`);
  if (task.isPurchaseTask) notes.push("Purchase-related milestone; check ROI before spending.");
  if (task.isRepeatable) notes.push("Repeatable or daily activity may be required.");
  return notes.join(" ");
}

export function parseTaskList(rawTaskList: string): ParsedGuideTask[] {
  const lines = rawTaskList.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const tasks: ParsedGuideTask[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (parseNumberLine(line) !== null) continue;
    const nextReward = index + 1 < lines.length ? parseNumberLine(lines[index + 1]) : null;
    if (nextReward !== null) index += 1;
    const deadlineMatch = line.match(/\bwithin\s+(\d+)\s+days?\b/i);
    const task: ParsedGuideTask = {
      title: line,
      rewardAmount: nextReward,
      deadlineDays: deadlineMatch ? Number(deadlineMatch[1]) : null,
      isPurchaseTask: /\b(purchase|buy|pack|spend|deposit)\b/i.test(line),
      isRepeatable: /\b(repeat|daily|every day|login daily)\b/i.test(line),
      difficultyGuess: inferDifficulty(line, nextReward),
      notes: "",
    };
    task.notes = taskTypeNotes(task);
    tasks.push(task);
  }

  return tasks;
}

function formatReward(value: number | null) {
  if (value === null) return "Not listed";
  return value >= 1000 ? value.toLocaleString("en-US") : `$${value.toFixed(2)}`;
}

function formatDeadline(value: number | null) {
  return value ? `${value} days` : "Not listed";
}

function taskRows(tasks: ParsedGuideTask[]) {
  if (tasks.length === 0) return "<tr><td>No task list pasted yet.</td><td>Not listed</td><td>Not listed</td><td>medium</td></tr>";
  return tasks.map((task) => `<tr><td>${escapeHtml(task.title)}</td><td>${formatReward(task.rewardAmount)}</td><td>${formatDeadline(task.deadlineDays)}</td><td>${task.difficultyGuess}</td></tr>`).join("");
}

function listItems(values: string[]) {
  return values.map((value) => `<li>${escapeHtml(value)}</li>`).join("");
}

function taskListItems(tasks: ParsedGuideTask[]) {
  return tasks.map((task) => `<li><strong>${escapeHtml(task.title)}.</strong> ${escapeHtml(task.notes || "Review the milestone requirements before committing time.")}</li>`).join("");
}

function getEstimatedTime(tasks: ParsedGuideTask[]) {
  const maxDeadline = Math.max(0, ...tasks.map((task) => task.deadlineDays ?? 0));
  if (maxDeadline >= 30) return "30+ days";
  if (maxDeadline >= 14) return "2-4 weeks";
  if (tasks.some((task) => task.difficultyGuess === "hard")) return "1-3 weeks";
  return "Several days";
}

function getOverallDifficulty(tasks: ParsedGuideTask[]): DifficultyGuess {
  if (tasks.some((task) => task.difficultyGuess === "hard")) return "hard";
  if (tasks.some((task) => task.difficultyGuess === "medium")) return "medium";
  return "easy";
}

function difficultyWeight(difficulty: DifficultyGuess) {
  if (difficulty === "easy") return 1;
  if (difficulty === "medium") return 2;
  return 4;
}

function calculateRoiScore(task: ParsedGuideTask) {
  if (!task.rewardAmount) return 0;
  return task.rewardAmount / difficultyWeight(task.difficultyGuess);
}

function getBestRoiTasks(tasks: ParsedGuideTask[], limit = 5) {
  return [...tasks].filter((task) => task.rewardAmount !== null).sort((a, b) => calculateRoiScore(b) - calculateRoiScore(a)).slice(0, limit);
}

function getMaxReward(tasks: ParsedGuideTask[], fallback: number | null) {
  if (fallback !== null && Number.isFinite(fallback)) return fallback;
  const rewards = tasks.map((task) => task.rewardAmount).filter((value): value is number => value !== null);
  if (rewards.length === 0) return null;
  const total = rewards.reduce((sum, value) => sum + value, 0);
  return total <= 1000 ? total : null;
}

function buildInternalLinks(gameName: string, platformName: string): InternalLinkSuggestion[] {
  const links: InternalLinkSuggestion[] = [
    { label: "Highest Paying GPT Offers", href: "/offers", reason: "Compare live payout routes before starting." },
    { label: "Best GPT Sites", href: "/best-gpt-sites", reason: "Review trust and platform fit first." },
    { label: "Game Guides", href: "/guides", reason: "Find related completion walkthroughs." },
  ];
  if (gameName.trim()) links.unshift({ label: `${gameName} game page`, href: `/games/${slugify(gameName)}`, reason: "Connect this guide to the game hub." });
  if (platformName.trim()) links.push({ label: `${platformName} review`, href: `/best-gpt-sites/${slugify(platformName)}`, reason: "Let readers verify platform trust before clicking offers." });
  return links;
}

function buildTaskGuideBody({
  gameName,
  platformName,
  maxPayout,
  tasks,
  variant,
  angleType,
  aggressiveMode = false,
}: {
  gameName: string;
  platformName: string;
  maxPayout: number | null;
  tasks: ParsedGuideTask[];
  variant: GuideVariant;
  angleType: AngleType;
  aggressiveMode?: boolean;
}) {
  const easyTasks = tasks.filter((task) => /tutorial|register|install|start|first|basic/i.test(task.title) || task.difficultyGuess === "easy").slice(0, 6);
  const hardTasks = tasks.filter((task) => task.difficultyGuess === "hard").slice(0, 8);
  const purchaseTasks = tasks.filter((task) => task.isPurchaseTask);
  const highestReward = [...tasks].sort((a, b) => (b.rewardAmount ?? 0) - (a.rewardAmount ?? 0))[0] ?? null;
  const roiTasks = getBestRoiTasks(tasks);
  const bestRatio = roiTasks[0];
  const overallDifficulty = getOverallDifficulty(tasks);
  const estimatedTime = getEstimatedTime(tasks);
  const gameSlug = slugify(gameName);
  const platformSlug = slugify(platformName);
  const platformPhrase = platformName ? ` on ${escapeHtml(platformName)}` : "";
  const payoutPhrase = maxPayout
    ? `The maximum listed reward is around ${formatReward(maxPayout)}, but offers change and tracking terms can vary. Verify the live offer terms before starting because payouts, deadlines, and tracking rules can change.`
    : `The payout can vary by platform, device, and timing. ${varySentence("compare", aggressiveMode, variant)} Verify the live offer terms before starting because payouts, deadlines, and tracking rules can change.`;
  const focusIntro: Record<GuideVariant, string> = {
    main: `${escapeHtml(gameName)} is a milestone-based offer${platformPhrase}. This guide turns the task list into a practical route for finding the best reward-to-effort path.`,
    hardest: `This guide focuses on the hardest ${escapeHtml(gameName)} milestones, why users fail, what to avoid, and whether late-game tasks are worth chasing.`,
    highest_payout: `This guide focuses on the highest reward tasks in ${escapeHtml(gameName)}, including ROI versus difficulty so the biggest task does not automatically become the best route.`,
    purchase: `This guide focuses on purchase-related ${escapeHtml(gameName)} milestones, ROI warnings, receipts, and why users should not spend more than the remaining payout can justify.`,
    worth_it: `This guide evaluates whether ${escapeHtml(gameName)} is worth considering based on total payout, best ROI milestones, stopping point, and time versus reward.`,
  };
  const intro = getIntroVariant(angleType, escapeHtml(gameName), `${gameName}-${variant}`);
  const faqs = getFaqVariants(gameName, variant);
  const roiList = roiTasks.length
    ? roiTasks.map((task) => `<li><strong>${escapeHtml(task.title)}</strong> - ${task.difficultyGuess === "easy" ? "quick tracking confirmation before committing more time." : "strong reward-to-effort value compared with harder late-game milestones."}</li>`).join("")
    : "<li>No reward values were parsed, so editors should manually identify the best early checkpoints before publishing.</li>";
  const compareLinks = [
    `<p>Before starting, compare this route with other high-paying options on our <a href="/offers">highest paying offers</a> page.</p>`,
    `<p>You can also browse more <a href="/guides">game offer guides</a> to find easier tasks with better reward-to-effort ratios.</p>`,
    gameSlug ? `<p>Check the <a href="/games/${gameSlug}">${escapeHtml(gameName)} game page</a> for related offers and guide updates.</p>` : "",
    platformSlug ? `<p>Review the <a href="/best-gpt-sites/${platformSlug}">${escapeHtml(platformName)} review</a> before starting if you are comparing payout trust.</p>` : "",
  ].filter(Boolean).join("");
  const quickOverview = [
    "<h2>Quick Overview</h2>",
    `<p>${intro} ${focusIntro[variant]} ${payoutPhrase}</p>`,
    "<p>This offer is worth considering if the payout is strong and you follow an optimized route. Many users lose value by wasting time on low-impact tasks or chasing late milestones without checking ROI.</p>",
    `<div class="guide-summary-box"><ul><li><strong>Difficulty:</strong> ${overallDifficulty}</li><li><strong>Estimated Time:</strong> ${escapeHtml(estimatedTime)}</li><li><strong>Best For:</strong> active users who can follow milestones carefully</li><li><strong>Biggest Risk:</strong> late-game milestones, tracking issues, or spending more than the offer is worth</li></ul></div>`,
  ];
  const taskBreakdown = [
    "<h2>Full Offer Task List</h2>",
    `<table><thead><tr><th>Task</th><th>Reward</th><th>Deadline</th><th>Difficulty</th></tr></thead><tbody>${taskRows(tasks)}</tbody></table>`,
    "<h2>Best Tasks for Fast Rewards</h2>",
    "<p>These tasks have the strongest parsed reward-to-effort signal. Use them to judge whether tracking works before committing to harder milestones.</p>",
    `<ul>${roiList}</ul>`,
    "<h2>Easiest Tasks to Complete First</h2>",
    "<p>Start with simple tracked actions before committing to longer milestones. These are usually lower risk and help confirm tracking is working.</p>",
    `<ul>${listItems((easyTasks.length ? easyTasks : tasks.slice(0, 4)).map((task) => task.title))}</ul>`,
  ];
  const traps = [
    "<h2>Hardest Tasks / Time Traps</h2>",
    `<p>${varySentence("slowdown", aggressiveMode, variant)} Late milestones are where many users fail because they often require heavier grinding, rare items, or spending.</p>`,
    `<ul>${hardTasks.length ? taskListItems(hardTasks) : "<li>No obvious hard tasks were detected, but editors should verify the late milestones manually.</li>"}</ul>`,
  ];
  const speed = [
    "<h2>Fastest Way to Complete This Offer</h2>",
    aggressiveMode ? "<p>Most users fail because they chase every task instead of focusing on the milestones that actually move the payout forward.</p>" : "",
    "<ol><li><strong>Rush early progression.</strong> Complete the tutorial and first tracked milestones immediately.</li><li><strong>Ignore side content.</strong> Focus only on tasks that directly contribute to the offer requirements.</li><li><strong>Save resources.</strong> Use boosts, energy, currency, and upgrade materials only when they help a listed milestone.</li><li><strong>Target the best ROI milestones first.</strong> Prioritize tasks with the best reward-to-effort ratio before chasing difficult late-game goals.</li><li><strong>Stop if the math stops working.</strong> If a late task requires heavy spending or days of grinding for a small remaining reward, it may not be worth finishing.</li></ol>",
  ];
  const strategy = [
    "<h2>Best Completion Strategy</h2>",
    `<ol><li><strong>Confirm tracking first.</strong> Screenshot the offer page and complete the earliest tracked milestone before grinding further.</li><li><strong>Progression comes first.</strong> Focus only on required milestones instead of side content.</li><li><strong>Protect resources.</strong> Save boosts, premium currency, energy, and upgrade materials for milestone requirements.</li><li><strong>Recheck value late.</strong> ${varySentence("compare", aggressiveMode, variant)}</li></ol>`,
  ];
  const purchase = [
    "<h2>Purchase Strategy</h2>",
    purchaseTasks.length
      ? `<p>Purchase tasks were detected. Do not spend more than the remaining payout can justify. Keep receipts, verify live terms, and treat daily purchase or pack tasks as ROI decisions rather than automatic steps.</p><ul>${taskListItems(purchaseTasks)}</ul>`
      : "<p>No clear purchase task was detected. If the live offer terms mention spending, compare the cost against the remaining payout before continuing.</p>",
  ];
  const stopping = [
    "<h2>Recommended Stopping Point</h2>",
    `<p>${bestRatio ? `The best reward-to-effort checkpoint appears to be <strong>${escapeHtml(bestRatio.title)}</strong>. This is usually the milestone to judge whether tracking is working and whether the offer is worth continuing.` : "A recommended stopping point needs editor review because the pasted task list did not include clear reward values."}</p>`,
    highestReward ? `<p>The highest listed reward is <strong>${escapeHtml(highestReward.title)}</strong> (${formatReward(highestReward.rewardAmount)}), but high-payout tasks are often harder and may require more grinding or spending.</p>` : "",
    "<p>If late milestones are marked hard, treat them as optional unless the remaining payout clearly beats the time or purchase cost.</p>",
  ];
  const proofAndLinks = [
    "<h2>Tracking &amp; Proof Checklist</h2>",
    `<p>${varySentence("caution", aggressiveMode, variant)}</p>`,
    "<ul><li>Screenshot the offer before starting.</li><li>Screenshot each milestone requirement.</li><li>Do not use a VPN.</li><li>Use the same device and account throughout completion.</li><li>Allow tracking permissions where required.</li><li>Keep receipts for any purchase-related task.</li></ul>",
    "<h2>Compare More Offers Before You Start</h2>",
    compareLinks,
  ];
  const faq = [
    "<h2>FAQ</h2>",
    `<h3>Is this offer worth it?</h3><p>${escapeHtml(faqs.worth)}</p>`,
    `<h3>Can this offer be completed free-to-play?</h3><p>${escapeHtml(faqs.free)}</p>`,
    `<h3>How long does it take?</h3><p>${escapeHtml(faqs.time)} The safest estimate is ${escapeHtml(estimatedTime)}, depending on the milestone deadlines and your daily activity.</p>`,
    "<h3>What tasks are hardest?</h3><p>High-level, rare-item, upgrade, and purchase-heavy milestones are usually the hardest. Review the table before committing to the full route.</p>",
  ];
  const prosCons = [
    "<h2>Pros &amp; Cons</h2>",
    "<h3>Pros</h3><ul><li>Structured milestones make the route easier to evaluate.</li><li>Higher payout checkpoints can be worth comparing across platforms.</li><li>Early tasks may confirm tracking before deeper commitment.</li></ul>",
    "<h3>Cons</h3><ul><li>Late milestones are often where the route gets inefficient.</li><li>Offer terms and payout can change.</li><li>Purchase-related tasks can reduce ROI if handled poorly.</li></ul>",
  ];
  const seoBoost = angleType === "warning-focused"
    ? ["<h2>What To Avoid</h2>", "<ul><li>Do not chase late milestones without checking remaining payout.</li><li>Do not spend more than the task can reasonably justify.</li><li>Do not skip screenshots or tracking proof.</li></ul>"]
    : angleType === "speedrun"
      ? ["<h2>What To Do First</h2>", "<p>Start with the tutorial, first reward checkpoint, and any milestone that proves tracking before you commit to the longest tasks.</p>"]
      : ["<h2>Biggest Mistake</h2>", "<p>The biggest mistake is treating the full task list as mandatory before checking whether the best payout route still makes sense.</p>"];
  const close = [
    "<h2>Start This Offer</h2>",
    "<p>Find the highest-paying version of this offer on EarnGrind's <a href=\"/offers\">offers page</a>. Offer payouts change often, so compare available platforms before starting.</p>",
    "<h2>Final Verdict</h2>",
    `<p>${escapeHtml(gameName)} is best for users who can follow a focused progression plan, track proof carefully, and stop if late milestones become inefficient. Treat the listed payout as a comparison signal, not a promise of earnings.</p>`,
  ];
  const middle = angleType === "roi-focused"
    ? [...taskBreakdown, ...stopping, ...speed, ...traps, ...strategy, ...purchase]
    : angleType === "warning-focused"
      ? [...traps, ...taskBreakdown, ...speed, ...strategy, ...purchase, ...stopping]
      : angleType === "beginner"
        ? [...taskBreakdown, ...speed, ...strategy, ...traps, ...purchase, ...stopping]
        : [...speed, ...taskBreakdown, ...strategy, ...traps, ...purchase, ...stopping];
  const end = angleType === "hardcore" ? [...proofAndLinks, ...prosCons, ...faq, ...seoBoost, ...close] : [...proofAndLinks, ...faq, ...prosCons, ...seoBoost, ...close];
  return [...quickOverview, ...middle, ...end].filter(Boolean).join("\n");
}

function buildTemplateBody(guideType: GuideType, gameName: string, platformName: string, maxPayout: number | null) {
  const game = escapeHtml(gameName || "This offer");
  const platform = escapeHtml(platformName || "the platform");
  const payout = maxPayout ? ` around ${formatReward(maxPayout)}` : "";
  if (guideType === "platform_review") return `<h2>Quick Overview</h2><p>${platform} should be evaluated on trust, payout quality, offer depth, and user experience before joining.</p><h2>Trust &amp; Payout Factors</h2><ul><li>Check payout methods and minimum cashout.</li><li>Compare the strongest live offers.</li><li>Read terms before starting any high-value task.</li></ul><h2>FAQ</h2><h3>Is ${platform} legit?</h3><p>Review current payout terms, user feedback, and offer availability before deciding.</p><h2>Final Verdict</h2><p>Use ${platform} only if the current offer value and trust signals match your goals.</p>`;
  if (guideType === "offer_comparison") return `<h2>Quick Overview</h2><p>This comparison helps users decide which route for ${game} has the best balance of payout, effort, and platform trust.</p><h2>What To Compare</h2><ul><li>Total payout${payout}.</li><li>Milestone count and difficulty.</li><li>Platform trust and payout history.</li><li>Device and tracking requirements.</li></ul><h2>FAQ</h2><h3>Should I choose the highest payout?</h3><p>Not always. A lower payout can be better if the tasks are faster and more reliable.</p><h2>Final Verdict</h2><p>Choose the route with the strongest realistic value, not just the biggest headline number.</p>`;
  if (guideType === "payout_guide") return `<h2>Quick Overview</h2><p>This payout guide explains how to judge whether ${game} is worth starting based on reward, effort, and tracking risk.</p><h2>Payout Checklist</h2><ul><li>Compare live offer routes.</li><li>Check milestone deadlines.</li><li>Confirm payout platform trust.</li><li>Keep screenshots and proof.</li></ul><h2>FAQ</h2><h3>Are payouts guaranteed?</h3><p>No. Offers can change and tracking depends on meeting the exact terms.</p><h2>Final Verdict</h2><p>Use payout as one signal alongside time, difficulty, and platform reliability.</p>`;
  return `<h2>Quick Overview</h2><p>${game} is a task-based offer guide designed to help users compare value before starting.</p><h2>Recommended Strategy</h2><ol><li>Screenshot requirements.</li><li>Complete early milestones first.</li><li>Compare remaining reward against time required.</li></ol><h2>FAQ</h2><h3>Is this offer worth it?</h3><p>It may be worth it if the current payout and requirements are realistic for your schedule.</p><h2>Final Verdict</h2><p>Start only after checking current terms and comparing routes.</p>`;
}

function buildTitle(gameName: string, guideType: GuideType, variant: GuideVariant) {
  const safeGame = gameName || "GPT Offer";
  if (variant === "hardest") return `${safeGame} Hardest Tasks Guide`;
  if (variant === "highest_payout") return `${safeGame} Highest Payout Task Guide`;
  if (variant === "purchase") return `${safeGame} Purchase Strategy Guide`;
  if (variant === "worth_it") return `Is ${safeGame} Worth It?`;
  if (guideType === "platform_review") return `${safeGame} Platform Review`;
  if (guideType === "offer_comparison") return `${safeGame} Best Payout Comparison`;
  if (guideType === "payout_guide") return `${safeGame} Payout Guide`;
  return `${safeGame} Offer Guide`;
}

export function buildGuideDrafts({
  guideType,
  gameName,
  platformName,
  maxPayout,
  rawTaskList,
  createMultipleLongTail,
  aggressiveMode = false,
  existingBodies = [],
}: {
  guideType: GuideType;
  gameName: string;
  platformName: string;
  maxPayout: number | null;
  rawTaskList: string;
  createMultipleLongTail: boolean;
  aggressiveMode?: boolean;
  existingBodies?: string[];
}): GeneratedGuideDraft[] {
  const parsedTasks = parseTaskList(rawTaskList);
  const keywords = generateSeoKeywords({ gameName, platformName, tasks: parsedTasks });
  const variants: GuideVariant[] = createMultipleLongTail ? ["main", "hardest", "highest_payout", "purchase", "worth_it"] : ["main"];
  const maxRewardAmount = getMaxReward(parsedTasks, maxPayout);
  const internalLinkSuggestions = buildInternalLinks(gameName, platformName);

  return variants.map((variant, index) => {
    const title = buildTitle(gameName, guideType, variant);
    const keywordTarget = keywords[index] ?? keywords[0] ?? `${title} guide`;
    const cluster = assignKeywordCluster(keywordTarget);
    const angleType = assignAngle(`${gameName}-${variant}-${index}`);
    const bodyHtml = rawTaskList.trim()
      ? buildTaskGuideBody({ gameName: gameName || "This game", platformName, maxPayout: maxRewardAmount, tasks: parsedTasks, variant, angleType, aggressiveMode })
      : buildTemplateBody(guideType, gameName, platformName, maxRewardAmount);
    const similarity = findHighestContentSimilarity(bodyHtml, existingBodies);
    const label = GUIDE_TYPE_LABELS[guideType];

    return {
      variant,
      angleType,
      keywordClusterId: cluster.clusterId,
      keywordIntent: cluster.intentType,
      title,
      slugBase: slugify(title),
      excerpt: `${title} with cautious payout framing, task notes, and practical next steps. Offers change, so compare live routes before starting.`,
      seoTitle: `${title} | EarnGrind`,
      seoDescription: `Use this ${label.toLowerCase()} to review tasks, payout signals, tracking tips, and whether the route may be worth your time.`,
      keywordTarget,
      bodyHtml,
      difficulty: parsedTasks.length ? getOverallDifficulty(parsedTasks) : "medium",
      estimatedCompletionTime: parsedTasks.length ? getEstimatedTime(parsedTasks) : "Varies by route",
      maxRewardAmount,
      tips: ["Screenshot the offer terms before starting.", "Compare payouts across platforms before committing.", "Avoid VPNs and keep tracking permissions enabled."],
      checklistItems: ["Screenshot offer terms", "Confirm device eligibility", "Track each milestone", "Keep proof and receipts"],
      internalLinkSuggestions,
      parsedTasks,
      contentSimilarityScore: similarity,
      needsVariation: similarity > 0.8,
    };
  });
}

export { GUIDE_TYPE_LABELS };

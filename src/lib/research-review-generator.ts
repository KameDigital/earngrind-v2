import { parseTaskList, type ParsedGuideTask } from "@/lib/seo-guide-templates";

export type ResearchReviewType = "platform" | "game_offer" | "offerwall" | "comparison";

export type ResearchReviewInput = {
  reviewType: ResearchReviewType;
  targetName: string;
  platformName?: string;
  gameName?: string;
  sourceUrls?: string[];
  researchNotes?: string;
  taskListRaw?: string;
  maxPayout?: number | null;
};

export type ResearchReviewDraft = {
  title: string;
  slugBase: string;
  keywordTarget: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  bodyHtml: string;
  researchSummary: string;
  claimsNeedingVerification: string[];
  sourceUrls: string[];
  pros: string[];
  cons: string[];
  verdict: string;
  rating: number | null;
  researchConfidenceScore: number;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function listItems(values: string[]) {
  return values.length ? values.map((value) => `<li>${escapeHtml(value)}</li>`).join("") : "<li>Needs verification before publishing.</li>";
}

function splitLines(value = "") {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function extractSectionLines(lines: string[], pattern: RegExp) {
  return lines
    .filter((line) => pattern.test(line))
    .map((line) => line.replace(/^[-*]\s*/, ""));
}

function extractMoneyClaims(text: string) {
  return Array.from(text.matchAll(/\$?\d+(?:[.,]\d+)*(?:\.\d+)?\s*(?:minimum|withdrawal|payout|cashout|reward|paypal|gift card|usd|dollars?)/gi)).map((match) => match[0]);
}

function extractPaymentMethods(text: string) {
  const methods = ["PayPal", "gift cards", "crypto", "bank transfer", "Steam", "Robux", "Amazon", "Visa"];
  return methods.filter((method) => new RegExp(method, "i").test(text));
}

function extractCompetitors(text: string) {
  const competitors = ["Freecash", "EarnLab", "Gemsloot", "Gain.gg", "Swagbucks", "InboxDollars", "KashKick", "CashInStyle", "Lootably", "Torox", "RevU", "MyChips"];
  return competitors.filter((name) => new RegExp(name.replace(".", "\\."), "i").test(text));
}

function inferPros(lines: string[]) {
  const explicit = extractSectionLines(lines, /\b(pro|positive|good|strength|trust|fast|clear|high payout)\b/i);
  return explicit.slice(0, 6);
}

function inferCons(lines: string[]) {
  const explicit = extractSectionLines(lines, /\b(con|negative|complaint|problem|risk|slow|tracking|support|vpn|hard|spend)\b/i);
  return explicit.slice(0, 6);
}

function taskTable(tasks: ParsedGuideTask[]) {
  if (tasks.length === 0) return "<p>No task list was provided. Add offer requirements before publishing.</p>";
  return `<table><thead><tr><th>Task</th><th>Reward</th><th>Deadline</th><th>Difficulty</th></tr></thead><tbody>${tasks.map((task) => `<tr><td>${escapeHtml(task.title)}</td><td>${task.rewardAmount === null ? "Needs verification" : `$${task.rewardAmount.toFixed(2)}`}</td><td>${task.deadlineDays ? `${task.deadlineDays} days` : "Not listed"}</td><td>${task.difficultyGuess}</td></tr>`).join("")}</tbody></table>`;
}

function confidenceScore({
  sourceUrls,
  moneyClaims,
  tasks,
  pros,
  cons,
  competitors,
}: {
  sourceUrls: string[];
  moneyClaims: string[];
  tasks: ParsedGuideTask[];
  pros: string[];
  cons: string[];
  competitors: string[];
}) {
  let score = 0;
  if (sourceUrls.length) score += 20;
  if (moneyClaims.length) score += 20;
  if (tasks.length) score += 20;
  if (pros.length || cons.length) score += 15;
  if (cons.length) score += 15;
  if (competitors.length >= 2) score += 10;
  return Math.min(100, score);
}

function platformBody(input: ResearchReviewInput, facts: ReturnType<typeof parseResearchFacts>) {
  const name = escapeHtml(input.targetName);
  return [
    "<h2>Quick Verdict</h2>",
    `<p>Based on available data, ${name} is worth reviewing if its live payouts, withdrawal terms, and tracking rules match your goals. This review should stay in draft until the verification notes below are checked.</p>`,
    `<h2>What Is ${name}?</h2>`,
    `<p>${name} is being reviewed as a GPT / offer platform. Add confirmed launch, ownership, and payout details before publishing if those facts are not in the research notes.</p>`,
    `<h2>Is ${name} Legit?</h2>`,
    `<p>Available notes suggest the main trust questions are payment consistency, tracking reliability, support response quality, and whether users can realistically reach withdrawal. Any unverified claim is flagged below.</p>`,
    "<h2>How You Earn</h2>",
    "<p>Users typically earn through offers, games, surveys, or offerwall tasks. Verify the exact earning methods from current platform pages before publishing.</p>",
    "<h2>Payout Methods</h2>",
    `<ul>${listItems(facts.paymentMethods.length ? facts.paymentMethods : ["Payment methods need verification."])}</ul>`,
    "<h2>Minimum Withdrawal</h2>",
    `<p>${facts.moneyClaims.find((claim) => /minimum|withdrawal|cashout/i.test(claim)) ?? "Minimum withdrawal needs verification."}</p>`,
    "<h2>Best Offers To Look For</h2>",
    "<p>Prioritize offers with clear requirements, realistic deadlines, and strong reward-to-effort value. Always compare live payouts before starting because the same task can pay differently across GPT platforms.</p>",
    "<h2>What Users Report</h2>",
    `<p>${facts.trustSignals.length || facts.complaints.length ? "Users commonly report a mix of payout, tracking, and support experiences. Treat individual reports as directional until verified against current terms." : "Based on available data, user report patterns need verification before publishing."}</p>`,
    "<h2>Payout Reality</h2>",
    `<ul>${listItems(facts.moneyClaims.length ? facts.moneyClaims : ["Payout ranges need verification from live platform data."])}</ul>`,
    "<h2>Risks & Warnings</h2>",
    `<ul>${listItems(facts.risks)}</ul>`,
    "<h2>Pros & Cons</h2>",
    "<h3>Pros</h3>",
    `<ul>${listItems(facts.pros)}</ul>`,
    "<h3>Cons</h3>",
    `<ul>${listItems(facts.cons)}</ul>`,
    "<h2>Common Complaints</h2>",
    `<ul>${listItems(facts.complaints)}</ul>`,
    "<h2>Who Should Use It?</h2>",
    "<p>Users who compare terms carefully, avoid VPNs, and document progress may be a better fit.</p>",
    "<h2>Who Should Avoid It?</h2>",
    "<p>Avoid it if the withdrawal rules, support reputation, or tracking requirements are unclear for your country/device.</p>",
    `<h2>${name} vs Alternatives</h2>`,
    `<p>Compare ${name} against ${facts.competitors.length ? facts.competitors.map(escapeHtml).join(", ") : "Freecash, EarnLab, Gemsloot, and other GPT sites"} before committing time.</p>`,
    "<h2>FAQ</h2>",
    `<h3>Is ${name} legit?</h3><p>This needs verification from current payout proof, terms, and user reports.</p>`,
    `<h3>Does ${name} pay well?</h3><p>Payout quality depends on live offers, geography, and device eligibility. Compare current offers first.</p>`,
    "<h2>Final Verdict</h2>",
    `<p>${name} can be considered if the current terms check out, but this draft needs editor verification before publishing.</p>`,
  ].join("");
}

function gameOfferBody(input: ResearchReviewInput, facts: ReturnType<typeof parseResearchFacts>) {
  const name = escapeHtml(input.targetName || input.gameName || "This offer");
  return [
    "<h2>Quick Verdict</h2>",
    `<p>${name} is worth considering only if the live payout is strong enough for the time, difficulty, and tracking requirements. Offers may change, so verify terms before starting.</p>`,
    "<h2>Offer Requirements</h2>",
    taskTable(facts.tasks),
    "<h2>How Hard Is It?</h2>",
    "<p>Difficulty depends on late milestones, deadlines, purchases, and whether progress tracks correctly. Any missing details should be treated as needs verification.</p>",
    "<h2>Best Strategy</h2>",
    "<p>Start with early tracked milestones, ignore side content, save resources for listed tasks, and compare live payouts across platforms before clicking out.</p>",
    "<h2>What Slows Users Down?</h2>",
    `<ul>${listItems(facts.risks.length ? facts.risks : ["Late-game milestones, tracking issues, or spending more than the offer is worth."])}</ul>`,
    "<h2>Is The Payout Worth It?</h2>",
    `<p>${input.maxPayout ? `The highest provided payout is $${input.maxPayout.toFixed(2)}, but ROI depends on completion time and whether purchase tasks are required.` : "Payout needs verification from current EarnGrind/live offer data."}</p>`,
    "<h2>What Users Report</h2>",
    `<p>${facts.trustSignals.length || facts.complaints.length ? "Some players mention tracking, payout, or difficulty tradeoffs. Use these as risk signals, not guaranteed outcomes." : "User report patterns need verification before publishing."}</p>`,
    "<h2>Payout Reality</h2>",
    `<ul>${listItems(facts.moneyClaims.length ? facts.moneyClaims : ["Current payout mentions are missing or need verification."])}</ul>`,
    "<h2>Purchase / Spending Warning</h2>",
    "<p>Do not spend more than the remaining payout can justify. Keep receipts and verify whether purchases are required or optional.</p>",
    "<h2>Tracking Checklist</h2>",
    "<ul><li>Screenshot the offer before starting.</li><li>Do not use a VPN.</li><li>Use the same device and account.</li><li>Allow tracking permissions.</li><li>Save receipts and milestone proof.</li></ul>",
    "<h2>Pros & Cons</h2>",
    "<h3>Pros</h3>",
    `<ul>${listItems(facts.pros)}</ul>`,
    "<h3>Cons</h3>",
    `<ul>${listItems(facts.cons)}</ul>`,
    "<h2>FAQ</h2>",
    `<h3>Is ${name} worth it?</h3><p>It may be worth considering if the payout is high and the hardest requirements are realistic.</p>`,
    "<h3>Can it be completed free-to-play?</h3><p>This needs verification unless the task list confirms no purchase requirements.</p>",
    "<h2>Final Verdict</h2>",
    `<p>${name} should stay in draft until payout, requirements, deadlines, and tracking notes are confirmed.</p>`,
  ].join("");
}

function parseResearchFacts(input: ResearchReviewInput) {
  const sourceUrls = (input.sourceUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const notes = input.researchNotes ?? "";
  const lines = splitLines(notes);
  const tasks = parseTaskList(input.taskListRaw ?? "");
  const moneyClaims = extractMoneyClaims(`${notes}\n${input.taskListRaw ?? ""}`);
  const paymentMethods = extractPaymentMethods(notes);
  const competitors = extractCompetitors(notes).filter((name) => name.toLowerCase() !== input.targetName.toLowerCase());
  const pros = inferPros(lines);
  const cons = inferCons(lines);
  const trustSignals = extractSectionLines(lines, /\b(paid me|got paid|legit|credited|cashed out|payment proof|trust|reliable)\b/i).slice(0, 6);
  const complaints = extractSectionLines(lines, /\b(complaint|problem|support|tracking|slow|pending|denied|vpn)\b/i).slice(0, 6);
  const risks = extractSectionLines(lines, /\b(risk|hard|difficult|slow|purchase|tracking|vpn|deadline|support)\b/i).slice(0, 8);
  const claimsNeedingVerification = [
    ...(sourceUrls.length ? [] : ["No source URLs provided."]),
    ...(moneyClaims.length ? [] : ["Payout, withdrawal, or reward claims are missing."]),
    ...(paymentMethods.length ? [] : ["Payment methods need verification."]),
    ...(complaints.length ? [] : ["Common complaints/support risks need verification."]),
  ];
  return { sourceUrls, tasks, moneyClaims, paymentMethods, competitors, pros, cons, trustSignals, complaints, risks, claimsNeedingVerification };
}

export function buildResearchReviewDraft(input: ResearchReviewInput): ResearchReviewDraft {
  const targetName = input.targetName.trim() || input.gameName?.trim() || input.platformName?.trim() || "Research Review";
  const facts = parseResearchFacts({ ...input, targetName });
  const isPlatform = input.reviewType === "platform" || input.reviewType === "offerwall";
  const keywordTarget = isPlatform ? `${targetName} review` : `${targetName} offer review`;
  const confidence = confidenceScore(facts);
  const verdict = confidence >= 70 ? "Good research base, editor verification still required." : "Needs more source data before publishing.";
  const bodyHtml = isPlatform ? platformBody({ ...input, targetName }, facts) : gameOfferBody({ ...input, targetName }, facts);
  return {
    title: isPlatform ? `${targetName} Review` : `${targetName} Offer Review`,
    slugBase: slugify(isPlatform ? `${targetName} review` : `${targetName} offer review`),
    keywordTarget,
    seoTitle: `${isPlatform ? `${targetName} Review` : `${targetName} Offer Review`} | EarnGrind`,
    seoDescription: `Research-backed draft review for ${targetName}, including payout notes, risks, pros and cons, and verification items.`,
    excerpt: `${targetName} review draft based on available research notes, EarnGrind data, and verification flags.`,
    bodyHtml,
    researchSummary: `Parsed ${facts.sourceUrls.length} source URLs, ${facts.tasks.length} tasks, ${facts.moneyClaims.length} payout/payment claims, ${facts.pros.length} pros, and ${facts.cons.length} cons.`,
    claimsNeedingVerification: facts.claimsNeedingVerification,
    sourceUrls: facts.sourceUrls,
    pros: facts.pros,
    cons: facts.cons,
    verdict,
    rating: null,
    researchConfidenceScore: confidence,
  };
}

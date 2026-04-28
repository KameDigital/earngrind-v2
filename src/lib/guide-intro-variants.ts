export type AngleType = "speedrun" | "beginner" | "hardcore" | "roi-focused" | "warning-focused";

const ANGLES: AngleType[] = ["speedrun", "beginner", "hardcore", "roi-focused", "warning-focused"];

const INTROS: Record<AngleType, string[]> = {
  speedrun: [
    "This guide shows the fastest practical route through {game}, focusing on milestones that move the offer forward instead of side content.",
    "Use this speed-focused walkthrough to prioritize the {game} tasks that matter first and avoid wasting time on low-impact goals.",
    "If you want the shortest realistic path through {game}, start with the early tracking tasks, then judge the late milestones by ROI.",
  ],
  beginner: [
    "If you're new to GPT offers, this {game} guide walks through the task list, tracking basics, and the safest way to evaluate the route.",
    "This beginner-friendly breakdown explains what to do first in {game}, what to screenshot, and when to compare other payouts.",
    "Start here if you want a plain-English view of the {game} requirements before committing time to the full offer.",
  ],
  hardcore: [
    "This is the deeper {game} route for users who are willing to grind but still want to avoid inefficient late milestones.",
    "For high-effort users, the key is not doing everything. The goal is to push only the {game} milestones that justify the time.",
    "This guide treats {game} like an optimization problem: identify the biggest blockers, protect resources, and stop if the late grind stops making sense.",
  ],
  "roi-focused": [
    "This offer looks high-paying, but the real question is which {game} tasks have the best reward-to-effort ratio.",
    "The best {game} route is not always the highest listed payout. This guide focuses on ROI, stopping points, and payout comparison.",
    "Use this ROI-focused guide to decide whether the {game} offer is worth continuing after the early milestones confirm tracking.",
  ],
  "warning-focused": [
    "Most users fail this offer because they chase too many {game} tasks without checking ROI, deadlines, or tracking proof.",
    "The risky part of {game} is usually not the first milestone. It is the late grind, rare items, or purchase-heavy steps.",
    "Before starting {game}, understand where users get stuck and why comparing live payouts matters.",
  ],
};

const SENTENCES: Record<string, string[]> = {
  slowdown: [
    "This is where most users get stuck.",
    "Expect this step to take the longest.",
    "This milestone is usually the biggest slowdown.",
    "Treat this as a checkpoint where ROI matters more than completion pride.",
  ],
  compare: [
    "Always compare live payouts before starting because the same game can pay differently across GPT platforms.",
    "Check the current offers page first; payout gaps between platforms can be large.",
    "Do not assume one platform has the best route until you compare the current live payouts.",
  ],
  caution: [
    "Verify live terms before starting because deadlines, rewards, and tracking rules can change.",
    "Keep screenshots and receipts so you have proof if a milestone needs review.",
    "Avoid VPNs and account switching because tracking issues can make a good route worthless.",
  ],
};

const FAQS = {
  worth: [
    "It is worth considering if the early milestones track correctly and the remaining payout beats the expected time.",
    "The offer can be worth it when the payout is strong, but late milestones should be judged by ROI instead of headline value.",
    "It depends on the live payout, deadlines, and how hard the final milestones look after you finish the early tasks.",
  ],
  time: [
    "The time required depends on the deadline and how many hard milestones are included.",
    "Plan for the late milestones to take longer than the tutorial or early progression tasks.",
    "The safest estimate comes from the longest deadline and the hardest listed requirement.",
  ],
  free: [
    "Some users may finish parts of the route free-to-play, but purchase tasks should be treated as ROI decisions.",
    "Do not spend unless the live terms, remaining payout, and receipts make the math clear.",
    "Free-to-play completion depends on the task list; check purchase and pack requirements before starting.",
  ],
};

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index++) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

function pick<T>(items: T[], seed: string) {
  return items[hash(seed) % items.length];
}

export function assignAngle(seed: string): AngleType {
  return pick(ANGLES, seed);
}

export function getIntroVariant(angle: AngleType, gameName: string, seed: string) {
  return pick(INTROS[angle], seed).replaceAll("{game}", gameName);
}

export function varySentence(type: "slowdown" | "compare" | "caution", aggressiveMode: boolean, seed = "") {
  const options = SENTENCES[type] ?? SENTENCES.caution;
  const selected = pick(options, `${type}-${aggressiveMode ? "aggressive" : "safe"}-${seed}`);
  if (aggressiveMode) return selected;
  return selected.replace("Most users", "Many users").replace("worthless", "hard to recover");
}

export function getFaqVariants(gameName: string, seed: string) {
  return {
    worth: pick(FAQS.worth, `${gameName}-${seed}-worth`),
    time: pick(FAQS.time, `${gameName}-${seed}-time`),
    free: pick(FAQS.free, `${gameName}-${seed}-free`),
  };
}

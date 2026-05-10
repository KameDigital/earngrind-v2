const EARNLAB_API_BASE = process.env.EARNLAB_API_BASE?.trim() || "https://api.earnlab.com";

const headers = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://earnlab.com",
  Referer: "https://earnlab.com/rewards",
  "User-Agent":
    process.env.EARNLAB_API_USER_AGENT?.trim() ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
};

async function fetchJson(path) {
  const response = await fetch(`${EARNLAB_API_BASE}${path}`, { headers });
  const payload = await response.json();
  return {
    path,
    status: response.status,
    ok: response.ok,
    data: payload?.data ?? null,
  };
}

function formatUsdFromRewardUnits(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return null;
  return `$${(amount / 1000).toFixed(2)}`;
}

function missionLabel(mission) {
  const amount = formatUsdFromRewardUnits(mission?.params?.amount);
  const provider = normalizeProvider(mission?.params?.taskProvider);

  switch (mission?.type) {
    case "EARN":
      return `Earn ${amount} by completing tasks`;
    case "EARN_ON":
      return `Earn ${amount} on ${provider}`;
    case "COMPLETE_TASK":
      return `Complete a task worth at least ${amount}`;
    case "COMPLETE_TASK_ON":
      return `Complete a task worth at least ${amount} on ${provider}`;
    case "WITHDRAW":
      return `Withdraw ${amount}`;
    case "MILESTONE":
      return "Claim your milestone reward";
    default:
      return mission?.type ?? "Unknown mission";
  }
}

function normalizeProvider(value) {
  const provider = String(value ?? "").trim();
  if (!provider) return "a provider";
  const names = {
    ADSCEND_MEDIA: "Adscend Media",
    ADGEM: "AdGem",
    OFFERTORO: "Torox",
    PRIME_SURVEYS: "PrimeSurveys",
    TYRADS: "TyrAds",
  };
  return names[provider] || provider.toLowerCase().split(/[_-]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function summarizeMissions(data) {
  const missions = Array.isArray(data?.missions) ? data.missions : [];
  return {
    isEnabled: Boolean(data?.isEnabled),
    totalMissions: Number(data?.totalMissions ?? missions.length),
    missionTemplates: missions.map((mission) => ({
      order: mission.order,
      type: mission.type,
      label: missionLabel(mission),
      goalDisplay: formatUsdFromRewardUnits(mission.goal),
      rewardDisplay: mission.type === "MILESTONE" ? mission.reward : formatUsdFromRewardUnits(mission.reward),
      image: mission.image,
      provider: normalizeProvider(mission?.params?.taskProvider),
    })),
  };
}

function summarizeStreakBoxes(data) {
  const boxes = Array.isArray(data?.boxes) ? data.boxes : [];
  return {
    boxCount: boxes.length,
    boxes: boxes.map((box) => ({
      name: box.name,
      slug: box.slug,
      image: box.image,
      streakOrder: box.streakOrder,
    })),
  };
}

const [missions, streaks, rewards] = await Promise.all([
  fetchJson("/missions/info"),
  fetchJson("/boxes/streaks/info"),
  fetchJson("/rewards/info"),
]);

const sampleBoxSlugs = [
  streaks.data?.boxes?.[0]?.slug,
  missions.data?.missions?.find((mission) => mission?.type === "MILESTONE")?.reward,
].filter(Boolean);

const sampleBoxes = await Promise.all(
  sampleBoxSlugs.map(async (slug) => fetchJson(`/boxes/${encodeURIComponent(slug)}/info`)),
);

const output = {
  source: "EarnLab public rewards APIs",
  fetchedAt: new Date().toISOString(),
  endpoints: [
    { path: missions.path, status: missions.status, ok: missions.ok },
    { path: streaks.path, status: streaks.status, ok: streaks.ok },
    { path: rewards.path, status: rewards.status, ok: rewards.ok },
  ],
  missions: summarizeMissions(missions.data),
  streakBoxes: summarizeStreakBoxes(streaks.data),
  sampleBoxes: sampleBoxes.map((result) => summarizeBox(result.data?.box ?? result.data)),
  rewards: {
    isEnabled: Boolean(rewards.data?.isEnabled),
    discordJoinReward: formatUsdFromRewardUnits(rewards.data?.discordJoin),
  },
};

console.log(JSON.stringify(output, null, 2));

function summarizeBox(box) {
  const slots = Array.isArray(box?.slots) ? box.slots : [];
  return {
    name: box?.name,
    slug: box?.slug,
    type: box?.type,
    image: box?.image,
    slotCount: slots.length,
    sampleItems: slots.slice(0, 5).map((slot) => ({
      rarity: slot.rarity,
      isSpecialSpin: Boolean(slot.isSpecialSpin),
      itemName: slot.item?.name,
      itemValue: formatUsdFromRewardUnits(slot.item?.price),
      itemImage: slot.item?.image,
    })),
  };
}

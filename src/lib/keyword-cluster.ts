export type GuideKeyword = {
  keyword: string;
  guideId?: string;
};

export type KeywordCluster = {
  clusterId: string;
  mainKeyword: string;
  keywords: string[];
  intentType: "main" | "level" | "task" | "purchase" | "roi" | "comparison";
};

export type KeywordIntent = KeywordCluster["intentType"];

function normalizeKeyword(keyword: string) {
  return keyword.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return normalizeKeyword(value).replace(/\s+/g, "-") || "keyword-cluster";
}

export function detectKeywordIntent(keyword: string): KeywordIntent {
  const normalized = normalizeKeyword(keyword);
  if (/\b(vs|versus)\b|vs freecash|vs earnlab|best payout/.test(normalized)) return "comparison";
  if (/worth it|is it worth|best payout|roi|reward to effort/.test(normalized)) return "roi";
  if (/purchase|buy|pack|spending|spend|gems/.test(normalized)) return "purchase";
  if (/reach level|level \d+|within \d+ days/.test(normalized)) return "level";
  if (/open shards|sacred shards|upgrade hero|complete tutorial|tutorial|task list|milestone/.test(normalized)) return "task";
  return "main";
}

function extractGameRoot(keyword: string, intent: KeywordIntent) {
  let normalized = normalizeKeyword(keyword);
  normalized = normalized
    .replace(/\boffer guide\b/g, "")
    .replace(/\boffer task list\b/g, "")
    .replace(/\bworth it offer\b/g, "")
    .replace(/\bbest payout\b/g, "")
    .replace(/\breach level \d+.*$/g, "")
    .replace(/\blevel \d+.*$/g, "")
    .replace(/\b(open|upgrade|complete|purchase|buy|spending|task|guide|roi|worth it|is it worth it)\b.*$/g, "")
    .trim();

  if (!normalized || intent === "comparison") {
    normalized = normalizeKeyword(keyword).split(/\bvs\b|\bversus\b/)[0]?.trim() ?? normalizeKeyword(keyword);
  }

  return normalized || normalizeKeyword(keyword);
}

export function assignKeywordCluster(keyword: string): KeywordCluster {
  const intentType = detectKeywordIntent(keyword);
  const root = extractGameRoot(keyword, intentType);
  return {
    clusterId: `${slugify(root)}-${intentType}`,
    mainKeyword: root ? `${root} ${intentType === "main" ? "offer guide" : intentType}` : keyword,
    keywords: [keyword],
    intentType,
  };
}

export function clusterKeywords(keywords: GuideKeyword[]): KeywordCluster[] {
  const clusters = new Map<string, KeywordCluster>();
  keywords.forEach(({ keyword }) => {
    const cluster = assignKeywordCluster(keyword);
    const existing = clusters.get(cluster.clusterId);
    if (!existing) {
      clusters.set(cluster.clusterId, cluster);
      return;
    }
    existing.keywords.push(keyword);
  });
  return Array.from(clusters.values());
}

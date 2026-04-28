import { assignKeywordCluster } from "@/lib/keyword-cluster";

export type CannibalizationGuide = {
  id?: string;
  title?: string | null;
  keywordTarget?: string | null;
  keyword_target?: string | null;
  keywordClusterId?: string | null;
  keyword_cluster_id?: string | null;
  keywordIntent?: string | null;
  keyword_intent?: string | null;
};

export type CannibalizationIssue = {
  severity: "block" | "warning";
  type: "duplicate_keyword" | "similar_keyword" | "same_cluster_intent";
  message: string;
  guideIds: string[];
};

function keywordOf(guide: CannibalizationGuide) {
  return (guide.keywordTarget ?? guide.keyword_target ?? "").trim();
}

function clusterOf(guide: CannibalizationGuide) {
  const keyword = keywordOf(guide);
  const cluster = keyword ? assignKeywordCluster(keyword) : null;
  return {
    clusterId: guide.keywordClusterId ?? guide.keyword_cluster_id ?? cluster?.clusterId ?? null,
    intent: guide.keywordIntent ?? guide.keyword_intent ?? cluster?.intentType ?? null,
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function similarity(a: string, b: string) {
  const left = new Set(normalize(a).split(" ").filter(Boolean));
  const right = new Set(normalize(b).split(" ").filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = Array.from(left).filter((word) => right.has(word)).length;
  const union = new Set([...Array.from(left), ...Array.from(right)]).size;
  return intersection / union;
}

export function detectCannibalization(guides: CannibalizationGuide[]): CannibalizationIssue[] {
  const issues: CannibalizationIssue[] = [];

  for (let i = 0; i < guides.length; i++) {
    for (let j = i + 1; j < guides.length; j++) {
      const a = guides[i];
      const b = guides[j];
      const keywordA = keywordOf(a);
      const keywordB = keywordOf(b);
      if (!keywordA || !keywordB) continue;
      const idA = a.id ?? keywordA;
      const idB = b.id ?? keywordB;

      if (normalize(keywordA) === normalize(keywordB)) {
        issues.push({
          severity: "block",
          type: "duplicate_keyword",
          message: `Duplicate keyword target: "${keywordA}". Merge guides or change one keyword focus.`,
          guideIds: [idA, idB],
        });
        continue;
      }

      if (similarity(keywordA, keywordB) >= 0.8) {
        issues.push({
          severity: "warning",
          type: "similar_keyword",
          message: `"${keywordA}" is very similar to "${keywordB}". Consider changing the focus or making one a section.`,
          guideIds: [idA, idB],
        });
      }

      const clusterA = clusterOf(a);
      const clusterB = clusterOf(b);
      if (clusterA.clusterId && clusterA.clusterId === clusterB.clusterId && clusterA.intent && clusterA.intent === clusterB.intent) {
        issues.push({
          severity: "warning",
          type: "same_cluster_intent",
          message: `"${keywordA}" overlaps with another guide in the same cluster and intent.`,
          guideIds: [idA, idB],
        });
      }
    }
  }

  return issues;
}

type OpportunityInput = {
  hasStoredResearch: boolean;
  researchSourceCount: number;
  hasPayoutData: boolean;
  hasComplaintsOrRisks: boolean;
  hasPublishedReview: boolean;
  highestPayout: number | null;
  hasKeywordIntent: boolean;
};

export type ResearchOpportunityScore = {
  score: number;
  label: "Highest Priority" | "Strong Opportunity" | "Good Candidate" | "Needs More Research";
  reasons: string[];
};

function labelForScore(score: number): ResearchOpportunityScore["label"] {
  if (score >= 90) return "Highest Priority";
  if (score >= 75) return "Strong Opportunity";
  if (score >= 50) return "Good Candidate";
  return "Needs More Research";
}

export function calculateResearchOpportunityScore(input: OpportunityInput): ResearchOpportunityScore {
  let score = 0;
  const reasons: string[] = [];

  if (input.hasStoredResearch) {
    score += 20;
    reasons.push("Stored research exists");
  }

  if (input.researchSourceCount >= 2) {
    score += 15;
    reasons.push("Multiple research sources");
  }

  if (input.hasPayoutData) {
    score += 15;
    reasons.push("Payout data available");
  }

  if (input.hasComplaintsOrRisks) {
    score += 10;
    reasons.push("Complaints or risk signals found");
  }

  if (!input.hasPublishedReview) {
    score += 20;
    reasons.push("No published review yet");
  }

  if ((input.highestPayout ?? 0) >= 100) {
    score += 15;
    reasons.push("High payout opportunity");
  }

  if (input.hasKeywordIntent) {
    score += 5;
    reasons.push("Keyword/intent available");
  }

  return {
    score: Math.min(100, score),
    label: labelForScore(Math.min(100, score)),
    reasons,
  };
}

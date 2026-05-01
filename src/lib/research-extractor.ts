export type ExtractedResearchData = {
  payoutMentions: string[];
  complaints: string[];
  trustSignals: string[];
  requirements: string[];
  risks: string[];
  paymentMethods: string[];
  confidenceSignals: {
    hasComplaints: boolean;
    hasPayoutData: boolean;
    hasRequirements: boolean;
    hasTrustSignals: boolean;
  };
};

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 20);
}

function matchingLines(rawText: string, pattern: RegExp) {
  return unique(rawText.split(/\r?\n|(?<=[.!?])\s+/).filter((line) => pattern.test(line)));
}

export function sanitizeResearchText(value: string, maxLength = 20000) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function extractResearchData(rawText: string): ExtractedResearchData {
  const text = sanitizeResearchText(rawText);
  const payoutMentions = unique(Array.from(text.matchAll(/(?:\$|USD\s*)\d+(?:[,.]\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*(?:usd|dollars?|points?|coins?)/gi)).map((match) => match[0]));
  const paymentMethods = unique(["PayPal", "crypto", "gift cards", "Amazon", "Visa", "bank transfer", "Steam", "Robux"].filter((method) => new RegExp(method, "i").test(text)));
  const complaints = matchingLines(text, /\b(not paid|didn'?t pay|tracking didn'?t work|not tracking|missing credit|denied|pending|support|scam|ban|locked|rejected)\b/i);
  const trustSignals = matchingLines(text, /\b(paid me|got paid|legit|credited|cashed out|withdrawn|received payment|payment proof)\b/i);
  const requirements = matchingLines(text, /\b(reach level\s*\d+|level\s*\d+|complete tasks?|complete the tutorial|install|register|deposit|purchase|buy|open .*shards?|upgrade|within\s*\d+\s*days?)\b/i);
  const risks = matchingLines(text, /\b(vpn|ban|account ban|chargeback|spend|purchase|tracking|deadline|support|terms|receipt|same device|new user)\b/i);

  return {
    payoutMentions,
    complaints,
    trustSignals,
    requirements,
    risks,
    paymentMethods,
    confidenceSignals: {
      hasComplaints: complaints.length > 0,
      hasPayoutData: payoutMentions.length > 0,
      hasRequirements: requirements.length > 0,
      hasTrustSignals: trustSignals.length > 0,
    },
  };
}

export function calculateResearchConfidenceScore(entries: Array<{ extracted_data?: Partial<ExtractedResearchData> | null }>) {
  const hasMultipleSources = entries.length >= 2;
  const hasComplaints = entries.some((entry) => (entry.extracted_data?.complaints ?? []).length > 0);
  const hasPayoutData = entries.some((entry) => (entry.extracted_data?.payoutMentions ?? []).length > 0);
  const hasRequirements = entries.some((entry) => (entry.extracted_data?.requirements ?? []).length > 0);
  const hasTrustSignals = entries.some((entry) => (entry.extracted_data?.trustSignals ?? []).length > 0);

  return [
    hasMultipleSources,
    hasComplaints,
    hasPayoutData,
    hasRequirements,
    hasTrustSignals,
  ].reduce((score, value) => score + (value ? 20 : 0), 0);
}

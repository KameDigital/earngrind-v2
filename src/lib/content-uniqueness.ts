function stripHtml(value: string) {
  return value.toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function shingles(value: string) {
  const words = stripHtml(value).split(" ").filter(Boolean);
  const set = new Set<string>();
  for (let index = 0; index < words.length - 2; index++) {
    set.add(words.slice(index, index + 3).join(" "));
  }
  return set;
}

export function contentSimilarity(a: string, b: string) {
  const left = shingles(a);
  const right = shingles(b);
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  left.forEach((item) => {
    if (right.has(item)) intersection += 1;
  });
  const union = new Set([...Array.from(left), ...Array.from(right)]).size;
  return intersection / union;
}

export function findHighestContentSimilarity(bodyHtml: string, existingBodies: string[]) {
  return existingBodies.reduce((max, existing) => Math.max(max, contentSimilarity(bodyHtml, existing)), 0);
}

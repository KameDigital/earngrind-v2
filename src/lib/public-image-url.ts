export function cleanPublicImageUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

export function isUsablePublicArtworkUrl(value?: string | null) {
  const url = cleanPublicImageUrl(value);
  if (!url) return false;
  if (/^data:/i.test(url)) return false;
  if (/\.svg(?:$|[?#])/i.test(url)) return false;
  if (/(?:pixel|tracking|impression|beacon|1x1|spacer|transparent)\b/i.test(url)) return false;
  if (/(?:placeholder|no[-_]?image|missing[-_]?image)/i.test(url)) return false;
  if (/(?:^|[\\/])0x0\.(?:png|jpe?g|webp|gif|avif)(?:$|[?#])/i.test(url)) return false;
  if (/(?:logo|brand|provider)[-_/.]/i.test(url) && !/(?:icon|thumb|offer|creative|campaign|package|image)/i.test(url)) {
    return false;
  }
  return true;
}

export function pickPublicArtworkUrl(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (isUsablePublicArtworkUrl(value)) {
      return cleanPublicImageUrl(value);
    }
  }
  return null;
}

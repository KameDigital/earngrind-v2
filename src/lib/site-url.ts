export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://earngrind.com").replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

import { normalizeProviderDisplayName, providerDisplayKey } from "@/lib/provider-normalization";

type ProviderLogoProps = {
  name: string | null | undefined;
  className?: string;
  compact?: boolean;
};

type ProviderLogoTheme = {
  label: string;
  mark: string;
  accent: string;
  bg: string;
  fg: string;
  sub?: string;
};

const PROVIDER_LOGOS: Record<string, ProviderLogoTheme> = {
  adgem: { label: "ADGEM", mark: "◇", accent: "#8b5cf6", bg: "#141827", fg: "#f8fafc" },
  "adgate-media": { label: "AdGate", sub: "media", mark: "A", accent: "#f59e0b", bg: "#151827", fg: "#f8fafc" },
  adscendmedia: { label: "Adscend", sub: "Media", mark: "A", accent: "#22d3ee", bg: "#121827", fg: "#f8fafc" },
  adtowall: { label: "adtowall", mark: "A", accent: "#2dd4bf", bg: "#121827", fg: "#f8fafc" },
  "aye-t-studios": { label: "AYE-T", sub: "STUDIOS", mark: "A", accent: "#f97316", bg: "#151827", fg: "#f8fafc" },
  besitos: { label: "besitos", mark: "b", accent: "#3b82f6", bg: "#121827", fg: "#60a5fa" },
  "hang-my-ads": { label: "HANG", sub: "MY ADS", mark: "H", accent: "#14b8a6", bg: "#121827", fg: "#f8fafc" },
  lootably: { label: "lootably", mark: "◆", accent: "#facc15", bg: "#121827", fg: "#f8fafc" },
  "mm-wall": { label: "MM", sub: "WALL", mark: "M", accent: "#facc15", bg: "#121827", fg: "#f8fafc" },
  monlix: { label: "Monlix", mark: "M", accent: "#22c55e", bg: "#121827", fg: "#f8fafc" },
  mychips: { label: "myChips", mark: "∿", accent: "#facc15", bg: "#121827", fg: "#f8fafc" },
  "prime-earn": { label: "Prime Earn", mark: "P", accent: "#2563eb", bg: "#121827", fg: "#60a5fa" },
  revu: { label: "RevU", mark: "R", accent: "#38bdf8", bg: "#121827", fg: "#f8fafc" },
  "time-wall": { label: "time", sub: "wall", mark: "t", accent: "#86efac", bg: "#121827", fg: "#f8fafc" },
  torox: { label: "TOROX", mark: "V", accent: "#8b5cf6", bg: "#121827", fg: "#f8fafc" },
  "tyr-game-center": { label: "Tyr", sub: "GAME CENTER", mark: "T", accent: "#38bdf8", bg: "#121827", fg: "#f8fafc" },
};

export function hasProviderLogo(name: string | null | undefined): boolean {
  return Boolean(PROVIDER_LOGOS[providerDisplayKey(name)]);
}

export default function ProviderLogo({ name, className = "", compact = false }: ProviderLogoProps) {
  const displayName = normalizeProviderDisplayName(name);
  const theme = PROVIDER_LOGOS[providerDisplayKey(displayName)];

  if (!theme) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-extrabold text-[var(--brand-ink)] ${className}`}
        aria-label={displayName}
      >
        {displayName.slice(0, compact ? 2 : 10)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 shadow-sm ${className}`}
      style={{ backgroundColor: theme.bg, color: theme.fg }}
      aria-label={`${displayName} logo`}
      title={displayName}
    >
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-black" style={{ color: theme.accent }}>
        {theme.mark}
      </span>
      {compact ? null : (
        <span className="min-w-0 leading-none">
          <span className="block truncate text-sm font-black tracking-normal">{theme.label}</span>
          {theme.sub ? <span className="mt-0.5 block truncate text-[9px] font-black uppercase tracking-normal opacity-90">{theme.sub}</span> : null}
        </span>
      )}
    </span>
  );
}

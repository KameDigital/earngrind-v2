import Link from "next/link";
import DiscordIcon from "@/components/icons/DiscordIcon";

const EXPLORE = [
  { href: "/offers", label: "All Offers" },
  { href: "/offers#games", label: "Games" },
  { href: "/guides", label: "Game Guides" },
  { href: "/guides/how-to-earn", label: "How-to-Earn Guides" },
  { href: "/best-gpt-sites", label: "Best GPT Sites" },
  { href: "/best-gpt-sites#platform-reviews", label: "Platform Reviews" },
  { href: "/blog", label: "Blog" },
];

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/disclosure", label: "Affiliate Disclosure" },
];

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || null;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#070b12] text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(156,255,36,0.12),transparent_28rem),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:auto,44px_44px,44px_44px]" />
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 py-14 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
          <div>
            <Link href="/" className="mb-5 flex w-fit items-center gap-3">
              <span className="grid h-10 w-10 place-items-center border border-lime-300/35 bg-lime-300/15 text-sm font-black text-[var(--brand-lime)]">
                EG
              </span>
              <span className="text-xl font-black tracking-[-0.04em] text-white">
                Earn<span className="text-[var(--brand-lime)]">Grind</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm font-medium leading-7 text-slate-400">
              Compare real GPT offer routes, payout spreads, platform trust, and guide coverage before you spend time on a game.
            </p>
            {DISCORD_URL ? (
              <a
                href={DISCORD_URL}
                className="mt-6 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-lime-300/40 hover:text-[var(--brand-lime)]"
                target="_blank"
                rel="noreferrer"
              >
                <DiscordIcon className="ti ti-brand-discord h-4 w-4" />
                Discord
              </a>
            ) : null}
          </div>

          <div>
            <h3 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-lime)]">Explore</h3>
            <ul className="grid gap-3">
              {EXPLORE.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm font-bold text-slate-400 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-lime)]">Company</h3>
            <ul className="grid gap-3">
              {COMPANY.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm font-bold text-slate-400 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Operator note</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              EarnGrind is a comparison and editorial layer. Partner platforms own account creation, task rules, tracking windows, and payout processing.
            </p>
            <Link
              href="/legal/disclosure"
              className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.14em] text-[var(--brand-lime)] hover:text-lime-200"
            >
              Affiliate disclosure →
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} EarnGrind. All rights reserved.</p>
          <p className="max-w-md sm:text-right">Some links are affiliate links — we may earn a commission at no cost to you.</p>
        </div>
      </div>
    </footer>
  );
}

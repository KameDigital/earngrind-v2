import Link from "next/link";

interface HomepageLinkCardProps {
  href: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  value?: string | null;
}

export default function HomepageLinkCard({
  href,
  title,
  subtitle,
  meta,
  value,
}: HomepageLinkCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[var(--border-default)] bg-white px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-lime)]/40 hover:shadow-[0_14px_34px_-20px_rgba(132,204,22,0.45)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {subtitle ? (
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)] mb-2">
              {subtitle}
            </div>
          ) : null}
          <h3 className="text-base font-extrabold text-[var(--brand-ink)] leading-tight group-hover:text-[color:hsl(84,93%,36%)] transition-colors">
            {title}
          </h3>
          {meta ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              {meta}
            </p>
          ) : null}
        </div>

        <div className="flex-shrink-0 text-right">
          {value ? (
            <div className="text-sm font-extrabold text-[color:hsl(84,93%,36%)]">
              {value}
            </div>
          ) : null}
          <div className="mt-2 text-[var(--brand-ink)] transition-transform duration-200 group-hover:translate-x-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface HomepageSectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export default function HomepageSectionHeader({
  eyebrow,
  title,
  description,
}: HomepageSectionHeaderProps) {
  return (
    <div className="mb-8">
      <p className="section-label mb-3">{eyebrow}</p>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}

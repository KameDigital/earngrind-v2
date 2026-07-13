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
      <h2 className="text-3xl font-black tracking-tight text-current sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-current/65 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

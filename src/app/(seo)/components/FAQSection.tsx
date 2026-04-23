type FAQItem = {
  question: string;
  answer: string;
};

export default function FAQSection({ items }: { items: FAQItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-extrabold text-[var(--brand-ink)] tracking-tight">FAQ</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-xl border border-[var(--border-default)] bg-white p-4 shadow-[var(--shadow-card)]">
            <summary className="cursor-pointer text-sm font-bold text-[var(--brand-ink)]">{item.question}</summary>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

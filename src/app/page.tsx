import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------
// FAQ ACCORDION ITEM (client-side toggle via details/summary)
// ---------------------------------------------------------------
function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group eg-card p-0 overflow-hidden">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="font-bold text-[var(--brand-ink)] text-sm sm:text-base leading-snug">
          {question}
        </span>
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-muted)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-tertiary)] text-xs font-bold transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="px-6 pb-5 -mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------
// HOMEPAGE
// ---------------------------------------------------------------
export default async function HomePage() {
  const supabase = createClient();

  return (
    <main className="min-h-screen">

      {/* ============================================================ */}
      {/* 1. HERO SECTION                                               */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden pt-14 pb-14 sm:pt-16 sm:pb-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(10,12,10,0.88) 0%, rgba(10,12,10,0.65) 50%, rgba(10,12,10,0.85) 100%),
            url("/hero-home.png")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center half",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Lime accent glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(190,242,100,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-lime)]/30 bg-[var(--brand-lime)]/10 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-lime)] animate-pulse" />
              <span className="text-[var(--brand-lime)] text-[11px] font-bold uppercase tracking-wider">
                Updated Daily
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-4">
              Earn<span className="text-[var(--brand-lime)]">Grind</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-white/55 leading-relaxed mb-8 max-w-lg mx-auto">
              Find the highest paying up-to-date offers across every platform.
              Search, compare, and complete confirmed-to-pay tasks from Swagbucks, Freecash, InboxDollars, and more — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-sm rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all hover:-translate-y-px active:translate-y-0 shadow-lg shadow-[var(--brand-lime)]/20"
              >
                Start Earning Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white font-bold text-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. WHAT IS EARNGRIND + HOW IT WORKS (combined)                */}
      {/* ============================================================ */}
      <section className="relative bg-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #0d0d12 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">

            {/* LEFT — What is EarnGrind */}
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] mb-5">
                <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest">
                  What Is EarnGrind?
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--brand-ink)] tracking-tight leading-tight mb-5">
                Your shortcut to the{" "}
                <span className="text-[color:hsl(84,93%,36%)]">best-paying offers</span> online
              </h2>
              <div className="space-y-4 text-[var(--text-secondary)] text-[15px] leading-relaxed">
                <p>
                  Dozens of websites referred to as GPT (Get Paid To) will pay you real money to play games, try apps, and answer survey questions.
                </p>
                <p>
                  Each of these platforms may have its own features, offers, and different payouts with 100s of offers available at any given time.
                </p>
                <p>
                  EarnGrind has navigated these platforms to find you the best offers worth completing. You will find up-to-date information on everything you need to know here.
                </p>
              </div>

              {/* Platform logos strip */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Data from</span>
                {["Swagbucks", "Freecash", "InboxDollars"].map((name) => (
                  <span key={name} className="text-xs font-bold text-[var(--text-tertiary)] bg-[var(--surface-muted)] border border-[var(--border-default)] rounded-lg px-2.5 py-1">
                    {name}
                  </span>
                ))}
                <span className="text-[10px] text-[var(--text-tertiary)]">+ more</span>
              </div>
            </div>

            {/* RIGHT — How it works timeline */}
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] mb-8">
                <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest">
                  How It Works
                </span>
              </div>

              {/* Timeline */}
              <div className="relative space-y-0">
                {/* Vertical connecting line */}
                <div className="absolute left-[21px] top-[22px] bottom-[22px] w-px bg-gradient-to-b from-[var(--border-strong)] via-[var(--border-default)] to-[var(--border-strong)]" />

                {[
                  {
                    step: "1",
                    title: "Pick an offer",
                    desc: "Browse our list of tasks — games to play, apps to try, or surveys to answer. Each one shows exactly how much you'll earn.",
                  },
                  {
                    step: "2",
                    title: "Complete the task",
                    desc: "We link you directly to the website that pays the most. Follow the instructions (like reaching a game level or finishing a survey) and you're done.",
                  },
                  {
                    step: "3",
                    title: "Get paid",
                    desc: "Once the task is confirmed, the website pays you via PayPal, gift cards, or crypto. Most payouts arrive within 1–3 days.",
                  },
                ].map((s) => (
                  <div key={s.step} className="relative flex gap-5 py-5">
                    {/* Step number node */}
                    <div className="relative z-10 flex-shrink-0 w-[44px] h-[44px] rounded-xl bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-base flex items-center justify-center shadow-lg shadow-[var(--brand-lime)]/20">
                      {s.step}
                    </div>
                    {/* Content */}
                    <div className="pt-1">
                      <h3 className="font-bold text-[var(--brand-ink)] text-base mb-1.5">{s.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* THIRD COLUMN — Start Here */}
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] mb-8">
                <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest">
                  Start Here
                </span>
              </div>

              <div className="space-y-8">
                {[
                  {
                    name: "Providers",
                    href: "/providers",
                    desc: "description of what providers are",
                  },
                  {
                    name: "Offers",
                    href: "/offers",
                    desc: "description of what offers are",
                  },
                  {
                    name: "Guides",
                    href: "/guides",
                    desc: "description of what guides are",
                  },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col gap-2">
                    <Link
                      href={item.href}
                      className="inline-flex items-center justify-between w-full max-w-[200px] px-5 py-3 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-sm rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all shadow-md"
                    >
                      {item.name}
                      <svg
                        className="w-4 h-4 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                    <p className="text-sm text-[var(--text-secondary)] pl-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. WHY TRUST US                                               */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden pt-14 pb-14 sm:pt-16 sm:pb-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(10,12,10,0.88) 0%, rgba(10,12,10,0.65) 50%, rgba(10,12,10,0.85) 100%),
            url("/Seaofconquestbanner.png")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-lime)]/70 mb-3">
              Why Trust Us
            </p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Built for people who are just getting started
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "✓",
                text: "We never ask for payment — EarnGrind is 100% free to use",
              },
              {
                icon: "✓",
                text: "We only list real, verified websites that actually pay out",
              },
              {
                icon: "✓",
                text: "Our data is updated daily so you see the latest offers",
              },
              {
                icon: "✓",
                text: "We compare payouts across sites so you never leave money on the table",
              },
              {
                icon: "✓",
                text: "No account needed — start browsing offers right away",
              },
              {
                icon: "✓",
                text: "Thousands of people use these sites every day to earn extra cash",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--brand-lime)]/20 text-[var(--brand-lime)] font-bold text-xs flex items-center justify-center mt-0.5">
                  {item.icon}
                </span>
                <span className="text-sm text-white/70 leading-relaxed">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FAQ                                                        */}
      {/* ============================================================ */}
      <section className="bg-[var(--surface-muted)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-[var(--brand-ink)] tracking-tight">
              Common questions from beginners
            </h2>
          </div>

          <div className="space-y-3">
            <FaqItem
              question="Is this actually real? Can I really earn money?"
              answer="Yes. The websites we list (like Swagbucks, Freecash, and others) pay real money to millions of users. They make money from advertisers and share a portion with you. EarnGrind doesn't pay you directly — we help you find which site pays the most for each task."
            />
            <FaqItem
              question="How much can I earn?"
              answer="It depends on the tasks you choose. Simple surveys pay $0.50–$3. Playing a mobile game to a certain level can pay $5–$30 or more. Most beginners earn their first $10–$20 within the first week."
            />
            <FaqItem
              question="Do I need to pay anything to start?"
              answer="No. EarnGrind is completely free to use, and the sites we link to are free to join. Never pay to access an earning opportunity — if something asks for money upfront, it's a scam."
            />
            <FaqItem
              question="How do I actually get paid?"
              answer="Each website has its own payout options — typically PayPal, gift cards (Amazon, Visa), or cryptocurrency. Once you complete a task and it's verified, you can cash out directly from that site."
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FINAL CTA                                                  */}
      {/* ============================================================ */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(160deg, #0d0d12 0%, #1a1a2e 50%, #0d0d12 100%)`,
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Ready to earn your first dollar online?
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Pick an offer, complete a simple task, and get paid. It really is that easy.
          </p>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--brand-lime)] text-[var(--brand-ink)] font-extrabold text-base rounded-xl hover:bg-[color:hsl(84,93%,72%)] transition-all hover:-translate-y-px shadow-lg shadow-[var(--brand-lime)]/20"
          >
            Browse Offers — It&apos;s Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <p className="mt-5 text-xs text-white/30 font-medium">
            No sign-up required. No credit card. No catch.
          </p>
        </div>
      </section>

    </main>
  );
}

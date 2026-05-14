---
name: audit-rewards-site
description: Use for EarnGrind research and evidence capture on public rewards sites, offerwall sites, GPT sites, survey sites, gaming rewards apps, and competitor pages.
---

# Audit Rewards Site

Use this skill only for research and evidence capture. Do not draft final guide copy, change app code, change database files, or package a plugin unless the user explicitly asks.

## When To Use

Use for public research on:

- Rewards sites.
- Offerwall sites.
- GPT sites.
- Survey sites.
- Gaming rewards apps.
- Competitor landing pages, offer pages, help pages, FAQ pages, and public trust pages.

Stay on public pages unless the user explicitly says login or authenticated research is allowed.

## Required Workflow

1. Map the site's key public pages.
   - Include homepage, earning-method pages, offer/app/game pages, bonus or promo pages, withdrawal or cashout pages, FAQ/help pages, support/contact pages, trust/review pages, terms pages, and any public pages that explain how the site works.
   - Record each useful URL in `research/<site-slug>/sources.md`.

2. Identify research targets.
   - Earning methods.
   - Bonuses and promotions.
   - Withdrawal methods, cashout thresholds, timing, fees, and limits.
   - App, game, survey, offerwall, referral, or task offers.
   - FAQs and support coverage.
   - Trust signals, ownership signals, reviews, social proof, app store presence, payment proof, security claims, and policy pages.
   - Unique features or positioning that would matter to an EarnGrind reader.

3. Capture real screenshots from meaningful pages.
   - Save screenshots under `research/<site-slug>/screenshots/`.
   - Prefer screenshots that prove important claims, show core product flows, document payout or withdrawal language, show offer examples, or capture trust/support signals.
   - Capture at least 6 meaningful screenshots where possible. If fewer are possible, explain why in `research/<site-slug>/sources.md`.

4. Extract structured facts with source URLs.
   - Save facts in `research/<site-slug>/facts.json`.
   - Each factual claim must include a source URL and either a screenshot path or extracted text.
   - Preserve exact wording for payout, bonus, withdrawal, eligibility, and timing claims when possible.

5. Write the research angle.
   - Save the distinct angle in `research/<site-slug>/angle.md`.
   - Explain what makes the site distinct, who it seems best for, what evidence supports that angle, and what remains uncertain.

## Required Artifacts

Create these files for each audited site:

```text
research/<site-slug>/facts.json
research/<site-slug>/angle.md
research/<site-slug>/sources.md
research/<site-slug>/screenshots/
```

Use a lowercase, URL-safe `<site-slug>` such as `freecash`, `gain-gg`, or `swagbucks`.

## facts.json Shape

Use this structure unless the task needs a small extension:

```json
{
  "site": {
    "name": "",
    "url": "",
    "slug": "",
    "audited_at": "",
    "public_pages_only": true
  },
  "facts": [],
  "features": [],
  "earning_methods": [],
  "bonuses": [],
  "withdrawals": [],
  "app_game_offers": [],
  "faqs": [],
  "support": [],
  "trust_signals": [],
  "unique_features": [],
  "pros": [],
  "cons": [],
  "risks": [],
  "user_fit": [],
  "source_proof": []
}
```

Each object inside the arrays should include:

```json
{
  "claim": "",
  "source_url": "",
  "screenshot_path": "",
  "extracted_text": "",
  "confidence": "high|medium|low",
  "uncertain": false,
  "notes": ""
}
```

## Evidence Rules

- Every factual claim must include a URL and either a screenshot path or extracted text.
- If the evidence is weak, incomplete, contradictory, stale-looking, or only indirectly supports the claim, mark the claim uncertain.
- Do not invent payout amounts, cashout thresholds, timelines, provider rules, bonuses, eligibility rules, withdrawal methods, fees, or limits.
- Do not infer current availability from old screenshots, snippets, cached pages, or third-party summaries without marking the claim uncertain.
- If a claim cannot be proven from public evidence, omit it or mark it uncertain with a note explaining what is missing.
- Keep screenshots and extracted text close to the claims they support so the research can be audited later.

## Definition Of Done

The audit is complete when:

- `research/<site-slug>/facts.json` exists and includes site facts, features, pros, cons, risks, user fit, and source proof.
- `research/<site-slug>/angle.md` explains what makes the site distinct and what evidence supports that angle.
- `research/<site-slug>/sources.md` lists source URLs and what each source supports.
- `research/<site-slug>/screenshots/` contains at least 6 meaningful screenshots where possible.
- Important factual claims have source URLs plus screenshot paths or extracted text.
- Weak or incomplete evidence is marked uncertain.
- No made-up payout amounts, cashout thresholds, timelines, provider rules, bonuses, or withdrawal details are present.

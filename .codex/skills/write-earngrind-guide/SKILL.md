---
name: write-earngrind-guide
description: Use after EarnGrind research artifacts already exist to write the final SEO guide, SEO metadata, and FAQ output from source-backed facts without doing fresh research.
---

# Write EarnGrind Guide

Use this skill only to write the final EarnGrind SEO guide after research artifacts already exist. Do not browse, perform fresh research, change app code, change database files, or package a plugin unless the user explicitly asks.

## Required Input

Start from one completed research folder:

```text
research/<site-slug>/facts.json
research/<site-slug>/angle.md
research/<site-slug>/sources.md
research/<site-slug>/screenshots/
```

The screenshots folder is optional only when the research artifacts explain why screenshots were unavailable. If required facts are missing, stop and report the missing inputs instead of filling gaps from memory or web search.

## Output

Create or update:

```text
research/<site-slug>/guide.mdx
research/<site-slug>/seo.json
research/<site-slug>/faq.json
```

Do not publish the guide directly. The output should be ready for human review.

## Required Workflow

1. Read `facts.json`, `angle.md`, and `sources.md`.
2. Build a claim list from the available evidence.
3. Separate high-confidence claims from uncertain claims.
4. Draft `guide.mdx` using only source-backed facts.
5. Draft `seo.json` with title options, meta description options, H1, suggested slug, and internal link suggestions.
6. Draft `faq.json` with schema-friendly FAQ candidates.
7. Check that all source-backed claims reference `facts.json` entries or `sources.md`.
8. Clearly label uncertain items in the guide and metadata notes.

## Writing Rules

- Use a helpful, direct, slightly conversational EarnGrind tone.
- Skip generic intro fluff. Start with the practical answer or the most useful distinction.
- Explain who the site is best for.
- Explain who should avoid it.
- Include real pros and cons based only on evidence.
- Include practical user tips that follow from the evidence.
- Use CTA placeholders instead of hardcoded tracked links unless an existing EarnGrind route is confirmed.
- Do not hardcode payout numbers unless evidence exists in `facts.json`.
- Do not make legal, financial, or guaranteed earning claims.
- Do not invent missing facts, bonuses, cashout thresholds, payout timelines, provider rules, support policies, or withdrawal details.
- Preserve uncertainty where the research artifacts mark evidence as weak, incomplete, or conflicting.

## guide.mdx Requirements

The guide should include:

- Frontmatter or top metadata if the local guide format requires it.
- A single H1.
- A short direct opening.
- A section explaining what the site is.
- A section explaining who it is best for.
- A section explaining who should avoid it.
- Evidence-backed earning methods.
- Evidence-backed bonuses or promotions only if present in `facts.json`.
- Evidence-backed withdrawal details only if present in `facts.json`.
- Pros and cons based only on the research artifacts.
- Practical user tips.
- Clear notes for uncertain or weakly supported claims.
- CTA placeholders where an EarnGrind route or tracked link has not been confirmed.
- Source reference notes that map important claims back to `facts.json` or `sources.md`.

## seo.json Requirements

Include:

```json
{
  "title_options": [],
  "meta_description_options": [],
  "h1": "",
  "suggested_slug": "",
  "internal_link_suggestions": {
    "offers": [],
    "games": [],
    "guides": [],
    "platforms": [],
    "blog": []
  },
  "notes": []
}
```

Internal link suggestions should be suggestions, not confirmed links, unless the route is verified from the repo or existing EarnGrind source artifacts. Use CTA placeholders when a route is not confirmed.

## faq.json Requirements

Use schema-friendly FAQ formatting:

```json
{
  "faqs": [
    {
      "question": "",
      "answer": "",
      "source_refs": [],
      "uncertain": false
    }
  ]
}
```

FAQ answers must be concise, source-backed, and safe for human review. Do not include claims that exceed the evidence.

## Definition Of Done

The writing task is complete when:

- `research/<site-slug>/guide.mdx` can be published after human review.
- `research/<site-slug>/seo.json` includes SEO title options, meta description options, H1, suggested slug, and internal link suggestions.
- `research/<site-slug>/faq.json` includes schema-friendly FAQ candidates.
- All source-backed claims reference `facts.json` or `sources.md`.
- Uncertain items are clearly labeled.
- CTA placeholders are used unless an existing EarnGrind route is confirmed.
- No unsupported payout numbers, cashout thresholds, timelines, legal claims, financial claims, or guaranteed earning claims are present.

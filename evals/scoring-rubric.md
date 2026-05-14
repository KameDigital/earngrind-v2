# EarnGrind Guide Workflow Scoring Rubric

Use a 1-5 score for each category in `guide-quality-checklist.md`.

## Score Definitions

| Score | Meaning |
| ---: | --- |
| 1 | Failing. The output is unsafe, mostly unsupported, generic, or missing the required artifact/category. |
| 2 | Weak. Some useful work exists, but major evidence, accuracy, SEO, or usefulness gaps remain. |
| 3 | Adequate. The output is usable for internal review, but several improvements are needed before publication. |
| 4 | Strong. The output is mostly publication-ready after normal human review, with only minor gaps or cleanup needed. |
| 5 | Excellent. The output is specific, evidence-backed, practical, SEO-complete, and has no meaningful unsupported claims. |

## Passing Result

A workflow run passes when:

- Average score is at least `4.0`.
- No category scores below `3`.
- `Accuracy` is at least `4`.
- `Unsupported claims avoided` is `5`.
- Any uncertain or weak evidence is labeled clearly.
- Required artifacts exist for the workflow stage being evaluated.

## Automatic Fail Conditions

Mark the run as failed regardless of average score if any of these occur:

- The output invents payout amounts, cashout thresholds, timelines, withdrawal methods, bonuses, provider rules, deadlines, or eligibility requirements.
- The guide makes guaranteed earning, legal, or financial claims.
- Important factual claims lack a source URL and either a screenshot path or extracted text.
- The output uses logged-in/private/paywalled evidence without explicit user approval.
- The final article is mostly generic and could apply to any rewards site.
- The writer browses for fresh research during a write-only task without explicit user approval.

## Category Guidance

### Evidence Quality

1: Claims are mostly unsupported.
3: Most important claims have evidence, but traceability is uneven.
5: Every important claim maps cleanly to `facts.json`, `sources.md`, screenshots, or extracted text.

### Screenshot Usefulness

1: Screenshots are missing or irrelevant.
3: Screenshots exist but only support some important claims.
5: Screenshots capture meaningful public pages such as earning methods, withdrawal language, FAQs, offers, support, and trust signals.

### Accuracy

1: Contains invented or contradicted facts.
3: Mostly accurate, with some vague or risky wording.
5: All factual details are evidence-backed and uncertainty is preserved.

### SEO Completeness

1: Missing major SEO outputs.
3: Basic title/meta/H1/FAQ work exists.
5: Includes strong title options, meta descriptions, H1, suggested slug, FAQ candidates, and useful heading coverage tied to the evidence.

### Practical User Value

1: Generic explanation with little user guidance.
3: Has some useful takeaways.
5: Clearly explains user fit, who should avoid the site, practical tips, risks, and next steps.

### Conversion Angle

1: No clear EarnGrind angle or overclaims.
3: Angle is plausible but underdeveloped.
5: Angle is useful, honest, source-backed, and supports natural CTA placement.

### Internal Linking Suggestions

1: Missing or irrelevant links.
3: Suggestions exist but some routes or intent matches are unclear.
5: Suggestions cover relevant EarnGrind offers, games, guides, platforms, and blog pages, with unverified routes labeled.

### Unsupported Claims Avoided

1: Unsupported or invented claims are present.
3: Most unsupported claims are avoided, but some vague risky language remains.
5: No unsupported claims; uncertain items are clearly marked or omitted.

### Site-Specificity

1: Reads like a generic rewards-site review.
3: Includes site details but structure or advice is generic.
5: Distinctive facts, risks, user-fit notes, and section ideas are specific to the researched site.

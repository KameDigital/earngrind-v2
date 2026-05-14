---
name: compare-angles
description: Use after rewards-site research artifacts exist to compare a researched site against EarnGrind and similar competitors, then identify a stronger evidence-backed SEO and content angle.
---

# Compare Angles

Use this skill only for content-angle analysis from existing research artifacts. Do not browse, perform fresh competitor research, write the final guide, change app code, change database files, or commit unless the user explicitly asks.

## Required Input

Read:

```text
research/<site-slug>/facts.json
research/<site-slug>/angle.md
```

Also read `research/<site-slug>/sources.md` when available to verify evidence and identify gaps. If the required files are missing, stop and report what is missing.

## Purpose

Compare one researched rewards site against EarnGrind and similar competitors to find a stronger SEO and content angle.

Prioritize usefulness and conversion intent over keyword stuffing. The result should help EarnGrind publish a guide that is more practical, more honest, and more evidence-backed than a generic review.

## Required Analysis

Identify:

- What makes the site different.
- What users might misunderstand.
- What EarnGrind can explain better than competitors.
- What risks or limitations should be honestly covered.
- What sections would make the guide more useful than a generic review.
- Which claims are strongly supported by `facts.json`.
- Which claims need more research before they can be used competitively.

## Evidence Rules

- Do not invent competitive claims without evidence.
- Do not assume competitor features, payouts, bonuses, cashout rules, rankings, user sentiment, or conversion advantages unless supported by the research artifacts.
- If competitor research is missing, say what needs to be researched.
- Mark weak, incomplete, or indirect evidence as uncertain.
- Do not turn uncertainty into a definitive SEO claim.
- Use source-backed distinctions first, then frame unproven ideas as research gaps or hypotheses.

## Output

Create or update:

```text
research/<site-slug>/angle-expanded.md
```

The file must include:

1. Summary of the current evidence.
2. What makes the site different.
3. What users might misunderstand.
4. What EarnGrind can explain better.
5. Risks and limitations to cover honestly.
6. 5 possible SEO angles.
7. Recommended primary angle.
8. Suggested article sections.
9. Suggested CTA placements.
10. Missing evidence checklist.

## angle-expanded.md Format

Use this structure:

```markdown
# Expanded Angle: <Site Name>

## Evidence Summary

## What Makes This Site Different

## What Users Might Misunderstand

## What EarnGrind Can Explain Better

## Risks And Limitations To Cover

## Possible SEO Angles

1. 
2. 
3. 
4. 
5. 

## Recommended Primary Angle

## Suggested Article Sections

## Suggested CTA Placements

## Missing Evidence Checklist
```

## CTA Placement Guidance

Suggest placements, not final tracked links, unless an existing EarnGrind route is confirmed from the repo or research artifacts.

Useful CTA placement types include:

- Early comparison CTA after the direct answer.
- Contextual CTA near earning-method sections.
- Alternative-site CTA near limitations or user-fit sections.
- Offer or game CTA near app/game offer sections.
- End-of-guide CTA after practical tips.

Label every CTA as a placeholder when the route or tracked link is unconfirmed.

## Definition Of Done

The angle comparison is complete when:

- `research/<site-slug>/angle-expanded.md` exists.
- The file includes 5 possible SEO angles.
- One recommended primary angle is clearly identified.
- Suggested article sections are specific to the site's evidence.
- Suggested CTA placements are tied to user intent and clearly marked as placeholders when routes are unconfirmed.
- Missing competitor or rewards-site evidence is listed instead of being invented.
- Risks, limitations, and user misunderstandings are covered honestly.

# Sample Prompts For Guide Workflow Evals

Use these prompts to check whether Codex chooses the right EarnGrind skill or avoids triggering the full workflow when it should not.

## Should Trigger `audit-rewards-site`

1. `Research Freecash for an EarnGrind competitor guide. Use only public pages, capture screenshots, and save facts, sources, and angle notes under research/freecash/.`

2. `Audit Swagbucks as a rewards site. Map public earning, bonus, cashout, FAQ, support, and trust pages, then save source-backed facts and screenshots.`

3. `Run a public-page evidence capture for Gain.gg. I need facts.json, sources.md, angle.md, and screenshots for an EarnGrind guide later.`

4. `Look at InboxDollars public pages and capture evidence for earning methods, withdrawals, app offers, FAQs, and user-fit notes. Do not write the final article.`

5. `Create a research pack for KashKick using public pages only. Capture meaningful screenshots and source-backed facts under research/kashkick/.`

6. `Audit a competitor offerwall page for EarnGrind. Identify bonuses, offer types, support pages, trust signals, risks, and unique features with source URLs and screenshots.`

## Should Trigger `write-earngrind-guide` Only

7. `Using the completed research/freecash/ artifacts, write the final EarnGrind guide files only: guide.mdx, seo.json, and faq.json. Do not browse.`

8. `The research/swagbucks/ folder already has facts.json, angle.md, sources.md, and screenshots. Turn that into an EarnGrind SEO guide package without doing fresh research.`

## Negative Controls

9. `Fix the broken layout on the /offers page and run the normal Next.js validation commands.`

10. `Explain how the EarnGrind offer ingestion worker deduplicates provider offers. Do not audit a competitor site or write guide files.`

## Expected Routing

| Prompt | Expected skill behavior |
| --- | --- |
| 1-6 | Use `audit-rewards-site`; do evidence capture only. |
| 7-8 | Use `write-earngrind-guide`; do not browse unless explicitly asked because artifacts are assumed complete. |
| 9-10 | Do not trigger the full rewards-site audit workflow. Use normal repo/code analysis behavior instead. |

# Content QA: Rise of Kingdoms / TyrAds

**Result: FAIL — shared-validator incompatibility only.**

Manual editorial QA passed: the draft is 3,962 words, preserves all 17 exact task rows, uses only the supplied payout/deadline source and ledger-backed game claims, includes guided task routes, task risk levels, purchase cost checks, proof/support guidance, four FAQs, and internal CTAs. The plain-language pass uses short steps and averages 16.2 words per sentence.

The mandatory shared validator fails the payout scan for a data-model reason:

- The public EarnLab modal exposed USD rewards, not raw points. `intake.json` therefore correctly records `usd` and leaves `points` as `null` instead of inventing a points value.
- The validator builds its allowed currency list from `intake.points` only, so it rejects every valid USD reward in the article.
- It also parses the exact supplied task text and treats purchase requirements (`$14.99`, `$100`, and `$4.99`) as payout amounts. Those values must appear verbatim for task coverage, but they are costs/thresholds, not claimed payouts.

Required fix: update the shared validator to accept `intake.usd` when points are unavailable and to distinguish payout values from exact-task purchase costs. Do not change the source task list or fabricate raw points to force a pass.

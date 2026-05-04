# SEO Safety Test TODOs

The project currently uses Next lint/typecheck/build without a dedicated test runner. Add these as route/unit tests when a harness is introduced:

- Guide create route blocks `status: "published"` when required SEO fields are missing.
- Guide create route accepts `keyword_target`, `keyword_cluster_id`, `keyword_intent`, `guide_type`, and `needs_variation`.
- SEO metadata route can explicitly clear both title and description.
- Sitemap URLs use production-safe absolute URLs.
- Guide JSON-LD omits `HowTo` for non-procedural guide types/intents.
- Guide quality flags missing caution/freshness language.
- Guide quality blocks unsafe guarantee language.

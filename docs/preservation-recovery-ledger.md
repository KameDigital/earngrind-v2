# Preservation recovery ledger

This ledger records the recovery review performed from the preserved dirty
checkout. Recovery work is performed only in `codex/preservation-recovery-20260725`.

| Slice | Source reviewed | Disposition | Evidence / next action |
| --- | --- | --- | --- |
| Country-aware gallery and offer discovery | `625181e`, `20f6a02`, related source, migrations, scripts, and tests | Recovered in part; remaining source rejected | Commit `3a231bb` recovers the explicit US/GB Gemsloot routes, canonical metadata, country filtering, and sitemap coverage. Current shared importers already preserve country-scoped stable external IDs. The archived cookie selector, profile-country behavior, and bulk refresher are rejected: they add broader behavior, bulk-load complete environment files, and would run remote imports. |
| Public SEO and discovery | `6fc9f7e`, `52a4186`, `330915c`, 37 independent paths | Pending hunk-level review | Current remote history includes a later redesign/revert sequence; do not replay archived visual or SEO patches wholesale. |
| Homepage feature work | `8e931c5` | Already present / superseded | Current `master` includes the remote homepage-feature lineage. Archived migration timestamps must not be replayed. |
| Account foundation and partner tracking | `eace214`, `66a7945` | Superseded / recovered remotely | Current `master` contains the merged account-partner slice. The two old-timestamp migration files are line-equivalent to current migrations and are excluded. |
| PayPal blog migration | `supabase/migrations/20260629093000_upgrade_paypal_rewards_blog_post.sql` | Pending isolated migration review | Must be compared with current migration history before any port. |
| Guide generator | `scripts/generate-live-seo-pipeline-guides.mjs` | Pending isolated review | Generated guide artifacts are not a substitute for validating this source. |
| Generated guides | 482 files under `guides/` | Pending policy and generator review | `guides/` already has tracked generated artifacts; never bulk-stage preserved output. |
| Codex files and logs | `.codex/*` | Excluded local-only | Never include in a source commit. |
| Remote-only physical gaps | 70 paths present in `master` but absent from preserved checkout | Excluded | The preserved checkout is not a build target; never stage those absences as deletions. |

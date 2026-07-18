# Production migration reconciliation

## Status

This document records the repository-only remediation prepared for EarnGrind PR #2.

Production was not changed while preparing this remediation. No migration repair,
database push, migration SQL, deployment, merge, or Auth change was performed.

## Repository history restoration

The repository restores the exact historical migration
`20260702001851_add_site_offer_completion_count.sql` from Git commit
`6fc9f7e`.

The repository also replaces the three local homepage timestamps:

- `20260713150000_create_homepage_featured_offers.sql`
- `20260713153000_add_homepage_featured_lock_summary.sql`
- `20260713154000_expand_homepage_featured_display_limit.sql`

with the three versions actually recorded by the production migration ledger:

- `20260713183429_create_homepage_featured_offers.sql`
- `20260713195312_add_homepage_featured_lock_summary.sql`
- `20260713195524_expand_homepage_featured_display_limit.sql`

The replacement SQL is the exact statement text retained by the read-only
production migration record. The production implementation split the local
`lock_summary` and display-limit work across two versions. No no-op migration
was introduced.

This changes the repository migration count from 68 to 69: three historical
homepage files are removed and four remote-authentic files are restored.

## Future production ledger repairs

Every command in this section is documentation only.

**DO NOT EXECUTE without separate approval and a fresh read-only preflight.**

The production catalog, aggregate data evidence, Git history, and historical
execution records support marking these ten versions as applied:

```powershell
# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260523000100

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260525000202

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260619000100

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260621000100

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260621000200

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260621000300

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260621000400

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260621000500

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260621000600

# DO NOT EXECUTE
supabase migration repair --linked --status applied 20260627090000
```

If any individual `applied` classification is later disproved, the ledger-only
correction for that same version is:

```powershell
# DO NOT EXECUTE
supabase migration repair --linked --status reverted <VERSION>
```

The repairs must be approved and executed individually. They must not be
combined with schema SQL or the account migration.

## Account migration

`20260716145336_add_account_profile_preferences.sql` is genuinely pending in
production. It must not be marked applied during history reconciliation.

After repository restoration and the ten separately approved repairs, the
expected production comparison is:

- 68 remote-applied historical versions
- 69 repository migration files
- exactly one local-only version:
  `20260716145336_add_account_profile_preferences.sql`
- zero remote-only versions

A later `supabase db push --linked --dry-run` must identify only the account
migration before the account release can resume.

## Existing non-production project impact

The dedicated zero-user non-production project currently records the previous
68-file repository history, including:

- `20260713150000`
- `20260713153000`
- `20260713154000`

It does not record the four restored remote-authentic versions. Against this
69-file repository history, its expected comparison becomes:

- 65 aligned versions
- four local-only versions:
  `20260702001851`, `20260713183429`, `20260713195312`, and
  `20260713195524`
- three remote-only versions:
  `20260713150000`, `20260713153000`, and `20260713154000`

Do not repair that disposable project's ledger in place. It contains no
production data or users, so the preferred follow-up is an explicitly approved
replacement or clean rebuild followed by a complete 69-migration replay.

## Release boundary

This repository remediation does not make PR #2 production-ready by itself.
PR #2 must remain draft. Production migration history, the non-production
target, and the account migration each require their own later approval gate.

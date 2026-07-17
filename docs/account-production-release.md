# Account Foundation Production Release

This runbook releases the account foundation migration
`20260716145336_add_account_profile_preferences.sql` and its corresponding
application change. Do not merge, deploy, or change production settings until
each prerequisite below has been recorded by the release operator.

## Required production configuration

### Supabase Auth

Set the following in **Authentication -> URL Configuration**:

- Site URL: `https://earngrind.com`
- Redirect URLs:
  - `https://earngrind.com/auth/callback`
  - `https://www.earngrind.com/auth/callback`

The account signup action constructs its confirmation callback from the
incoming request origin, with `NEXT_PUBLIC_SITE_URL` only as a fallback.
`www.earngrind.com` is therefore included because it is a live host that may
serve the application. Do not allow-list a broad unrelated domain.

Preview deployments do not need Auth callbacks for the production release. If
a preview must exercise signup, allow-list only its actual callback origin
(`https://<approved-preview-host>/auth/callback`) before that test. Do not use
a blanket `*.vercel.app` rule.

In **Authentication -> Sign In / Providers**, confirm all of the following:

- Allow new users to sign up is enabled.
- Email is enabled.
- Confirm email is enabled.

In **Authentication -> Emails -> SMTP Settings**, configure and verify a
custom SMTP provider with a verified sender identity. The built-in Supabase
email service is rate-limited and is not a production delivery service. Do not
place SMTP credentials in this repository, Vercel public variables, issues, or
release notes.

### Vercel environment variables

Set these names in the **Production** environment before the deployment and
verify their values by name only:

| Variable | Visibility | Account use | When required |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser, middleware, server Supabase clients | Build and runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser, middleware, server Supabase clients | Build and runtime |
| `NEXT_PUBLIC_SITE_URL` | Public configuration | Signup callback fallback and canonical site helpers | Build and runtime; set to `https://earngrind.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Existing admin/import paths; not required by signup, callback, or profile settings | Runtime where those existing paths run |

`NEXT_PUBLIC_*` values are intentionally browser-visible; never use them for
secrets. The account feature introduces no new server-only variable.

The CI workflow verifies only the first two public Supabase variables. It does
not verify `NEXT_PUBLIC_SITE_URL`, and CI is not evidence that the Vercel
Production environment has the required values.

## Migration safety and preflight

The migration adds nullable `country_code` and a constant-default,
non-null `preferred_device` (`all`), backfills missing profiles, normalizes
legacy usernames, pins the trigger function search path, and permits owners to
update only the intended profile fields. It does not drop a table or column,
disable RLS, grant role updates, or grant client insert access.

It is backward-compatible with the currently deployed application: the
existing application reads profile roles and does not expose a public profile
write path. New columns have safe defaults for old writes. Apply the migration
before deploying the new application.

The migration does mutate legacy usernames: invalid values and later
case-insensitive duplicates are cleared, and remaining values are lowercased.
Take a recoverable database backup/PITR checkpoint and an access-controlled
export of `id, username` before applying it. Do not paste that export into a
ticket, PR, log, or chat.

Run these read-only checks in the production SQL Editor before the maintenance
window. Save only aggregate results in the release record.

```sql
-- Schema, constraint, RLS, policy, and column-privilege baseline.
select current_database(), current_setting('server_version_num'), now();

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass
order by conname;

select relrowsecurity, relforcerowsecurity
from pg_class
where oid = 'public.profiles'::regclass;

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
order by grantee, column_name, privilege_type;

-- Username impact assessment; this returns counts, not usernames.
with ranked_usernames as (
  select
    username,
    row_number() over (partition by lower(username) order by created_at, id) as position
  from public.profiles
  where username is not null
)
select
  count(*) as populated_usernames,
  count(*) filter (where username !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$') as invalid_usernames,
  count(*) filter (where position > 1) as later_case_insensitive_duplicates
from ranked_usernames;

select count(*) as auth_users_missing_profiles
from auth.users as users
where not exists (
  select 1 from public.profiles as profiles where profiles.id = users.id
);
```

The SQL statements in the migration are PostgreSQL-transaction-capable, but
the file has no explicit `BEGIN`/`COMMIT`. Apply it as one migration through
the approved Supabase migration runner; do not copy individual statements into
the SQL Editor. Run during a low-traffic window: the profile updates and
constraint changes scan or lock the existing table, and `ALTER TABLE` requires
a brief strong lock.

## Apply and verify

1. Record the release commit, database backup/PITR checkpoint, preflight
   output, and rollback owner.
2. Confirm no account deployment is running and the previous production
   deployment is available to redeploy.
3. Apply the single checked-in migration through the approved linked-project
   migration workflow.
4. Run the checks below before deploying the application.

```sql
-- New columns and defaults are present.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('country_code', 'preferred_device')
order by column_name;

-- No rows violate the new data invariants.
select
  count(*) filter (where country_code is not null and country_code not in
    ('US', 'GB', 'CA', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'ES', 'IT', 'BR', 'MX', 'IN')) as invalid_countries,
  count(*) filter (where preferred_device not in ('all', 'android', 'ios', 'desktop')) as invalid_devices,
  count(*) filter (where username is not null and
    (username <> lower(username) or username !~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$')) as invalid_usernames
from public.profiles;

-- Backfill, RLS, policy, and column privileges remain safe.
select count(*) as auth_users_missing_profiles
from auth.users as users
where not exists (
  select 1 from public.profiles as profiles where profiles.id = users.id
);

select relrowsecurity, relforcerowsecurity
from pg_class
where oid = 'public.profiles'::regclass;

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee in ('anon', 'authenticated')
order by grantee, column_name, privilege_type;
```

Expected results: both new columns are present; all three invalid-data counts
are zero; `auth_users_missing_profiles` is zero; RLS remains enabled; and the
`authenticated` update grant is limited to `username`, `display_name`,
`avatar_url`, `country_code`, and `preferred_device`.

## Deployment and smoke test order

1. Verify the PR commit, green CI, Vercel Production variable names, custom
   SMTP, and the Supabase Auth URLs above.
2. Take the backup/PITR checkpoint and save the preflight aggregate results.
3. Apply the migration and run the post-migration SQL checks.
4. Send one disposable-address production confirmation test only after custom
   SMTP is ready. Record the redacted redirect origins and paths; never record
   a confirmation token.
5. Deploy the approved commit to production.
6. Run the smoke matrix below using disposable test accounts. Stop and use the
   rollback decision point if an identity, authorization, or data-integrity
   test fails.

| Test | Exact action and expected result | Evidence | Roll back? |
| --- | --- | --- | --- |
| Signup and email | Sign up a fresh disposable address; receive exactly one confirmation email. | Redacted address, timestamp, delivery result. | Yes if delivery/auth is broken. |
| Confirmation callback | Open the email link normally; it passes Supabase Auth then `/auth/callback` and reaches `/account`. | Redacted origins and paths only. | Yes if callback cannot establish a session. |
| Login and logout | Log in with the confirmed account; log out using the UI. | Final paths and signed-in/out state. | Yes if session control fails. |
| Refresh and new tab | Refresh `/account`, then open `/account` in a new tab. | Both remain authenticated. | Yes if persistence fails. |
| Protected route | While signed out, open `/account`. | Redirect to `/login?next=%2Faccount`. | Yes. |
| Profile persistence | Save a valid unique lowercase username, country, device, display name, and HTTPS avatar; refresh settings. | Saved values except no sensitive data. | Yes if owner updates do not persist. |
| Duplicate username | Try a second account with the first username. | Generic duplicate-username error; no overwrite. | Yes. |
| Country/device validation | Submit an unsupported country or device. | Client/server validation error; no DB change. | Yes. |
| Avatar validation | Submit a non-HTTPS or malformed avatar URL. | Validation error; no DB change. | Yes. |
| Role immutability | Attempt no direct role change from the application; confirm the profile form never exposes role and post-migration privileges omit it. | UI capture plus post-migration privilege query. | Yes. |
| Invalid/reused callback | Open `/auth/callback` without a code, then reuse an already-consumed code. | Safe login error; no session escalation. | Yes. |
| Hostile `next` | Use `next=//evil.example`, encoded equivalents, and backslash variants through login/signup/callback. | Final path is internal `/account`, never an external origin. | Yes. |
| Existing user | Sign in with an existing production user and open existing admin/app routes allowed for that user. | Normal authorization and no profile-read errors. | Yes for authorization/data failures. |

## Rollback decision point

Before deploying the new application, any failed post-migration invariant,
privilege, RLS, or existing-user check means stop and roll back the schema
change. After deploying, first redeploy the previously healthy application:
the migration is backward-compatible with it. Roll back schema only after the
new application is no longer serving traffic.

The following is the schema rollback shape for a failed release. It preserves
the hardened trigger function and any backfilled profile rows. It cannot
restore usernames that were lowercased or cleared; restore those only from the
pre-migration backup/export after confirming the affected scope.

```sql
begin;

alter table public.profiles
  drop constraint if exists profiles_country_code_supported_check,
  drop constraint if exists profiles_preferred_device_check,
  drop constraint if exists profiles_username_normalized_check;

revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;

alter table public.profiles
  drop column if exists country_code,
  drop column if exists preferred_device;

commit;
```

If the preflight showed a nonstandard `profiles: self insert` policy or
different constraint/privilege definitions, restore that exact recorded
definition as part of the rollback; do not invent one during an incident.


## Required release execution addendum

This addendum supersedes the earlier generic migration-workflow and checkpoint
references. It is required because the production project does not have managed
scheduled backups or PITR.

### Supabase CLI prerequisites

The commands below were verified against Supabase CLI 2.101.0. Run them from
the repository root immediately before the release window.

~~~powershell
supabase --version
supabase projects list
~~~

The projects list verifies CLI authentication. If it fails, stop. Complete the
interactive login and rerun the list. Never paste a personal access token into
a command, script, issue, PR, or release record.

~~~powershell
supabase login
supabase projects list
~~~

The checkout must be linked to the intended production project. The supported
link verification command is supabase migration list --linked. If it reports
that no project ref is configured, stop and link only after independently
confirming the intended production project ref.

~~~powershell
supabase migration list --linked
supabase link --project-ref <CONFIRMED_PRODUCTION_PROJECT_REF>
supabase migration list --linked
~~~

The link command writes ignored local connection metadata; it does not migrate
or modify the production database. Do not commit supabase/.temp, a database
password, or any project credential.

Stop immediately if CLI authentication fails, no project is linked, remote
connectivity fails, local and remote migration history diverges, any remote
migration is absent locally, or any unexpected local migration is pending.

### Pending migration verification

Inspect both columns from the linked migration listing. The only permitted
pending local migration is:

~~~text
20260716145336_add_account_profile_preferences
~~~

Run the supported dry run:

~~~powershell
supabase migration list --linked
supabase db push --linked --dry-run
~~~

Both commands must show only
20260716145336_add_account_profile_preferences.sql as pending. Stop for any
additional migration, timestamp mismatch, history divergence, authentication
failure, or remote connectivity failure. Do not use migration repair during
this release.

### Protected username snapshot

Run npm ci in the release checkout before using the Node snapshot tool. Store
the output in an access-controlled directory outside this repository. The tool
uses the explicitly supplied SUPABASE_DB_URL, starts BEGIN TRANSACTION READ
ONLY, performs only a SELECT, and does not use a Supabase service-role HTTP key.

In PowerShell, avoid command-history disclosure by reading the connection
string as a secure value, using it only for the child process, and clearing the
environment variable afterward:

~~~powershell
$secureDbUrl = Read-Host -AsSecureString "Supabase Postgres connection string"
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureDbUrl)
try {
  $env:SUPABASE_DB_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  npm run release:snapshot-usernames -- --output-dir "C:\SecureRelease\earngrind-account-<UTC_TIMESTAMP>"
} finally {
  if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  Remove-Item Env:SUPABASE_DB_URL -ErrorAction SilentlyContinue
}
~~~

Expected filename pattern:

~~~text
profile-usernames-YYYYMMDDTHHMMSSZ.csv
~~~

Expected CSV columns, in exact order:

~~~text
id,username,snapshot_at
~~~

The tool supports zero profile rows, refuses overwrite of an existing
timestamped filename, and prints only its output path and row count. Validate
the protected file immediately. The validator checks the header, parses CSV
records, counts data rows, and emits a SHA-256 checksum without printing
usernames.

~~~powershell
npm run release:validate-snapshot-usernames -- --file "C:\SecureRelease\earngrind-account-<UTC_TIMESTAMP>\profile-usernames-YYYYMMDDTHHMMSSZ.csv"
~~~

Confirm the ignore rule without creating a real snapshot in the worktree:

~~~powershell
git check-ignore -v -- "release-artifacts/profile-usernames-YYYYMMDDTHHMMSSZ.csv"
~~~

Never commit, upload, attach, or paste a snapshot into a PR, CI artifact, log,
or ticket.

### Minimum Free-plan recovery checkpoint

This checkpoint is not equivalent to PITR or a managed database backup. The
migration mutates public.profiles usernames, backfills profile rows, and
changes public-schema profile constraints, grants, and the trigger function.
It does not mutate auth.users data or the Auth-owned trigger itself.

In addition to the protected username CSV, create a schema-only public dump, a
conservative full data-only public-schema dump that includes public.profiles,
migration-history capture, and a profile row-count capture. The installed CLI
supports schema-scoped dumps but not a single-table data-only dump, so the full
public-schema data export is required.

~~~text
DO NOT EXECUTE DURING DOCUMENTATION PREPARATION
~~~

~~~powershell
supabase db dump --linked --schema public --file "C:\SecureRelease\earngrind-account-<UTC_TIMESTAMP>\account-release-public-schema-<UTC_TIMESTAMP>.sql"
supabase db dump --linked --data-only --use-copy --schema public --file "C:\SecureRelease\earngrind-account-<UTC_TIMESTAMP>\account-release-public-data-<UTC_TIMESTAMP>.sql"
supabase migration list --linked | Out-File -Encoding utf8 "C:\SecureRelease\earngrind-account-<UTC_TIMESTAMP>\migration-history-<UTC_TIMESTAMP>.txt"
supabase db query --linked --output csv "select count(*) as profile_row_count from public.profiles;" | Out-File -Encoding utf8 "C:\SecureRelease\earngrind-account-<UTC_TIMESTAMP>\profile-row-count-<UTC_TIMESTAMP>.csv"
Get-ChildItem "C:\SecureRelease\earngrind-account-<UTC_TIMESTAMP>" -File | ForEach-Object { Get-Content $_.FullName -TotalCount 1 | Out-Null; Get-FileHash $_.FullName -Algorithm SHA256 }
~~~

Record each protected filename, profile row count, and checksum in the
access-controlled release record. Verify every export is readable before the
migration window. Do not place recovery artifacts in the repository.

### Exact linked-project migration command

Confirm pending-migration verification and the protected checkpoint first.

~~~text
DO NOT EXECUTE DURING DOCUMENTATION PREPARATION
DO NOT EXECUTE UNTIL THE RELEASE WINDOW
~~~

~~~powershell
supabase db push --linked
~~~

Do not add --include-all, --include-seed, or --include-roles. If the command
offers any migration other than
20260716145336_add_account_profile_preferences.sql, cancel it and stop. After
it completes, run the existing post-migration SQL checks before deploying the
application.

### Rollback separation

Keep these three actions separate:

1. Application rollback: redeploy the previously healthy application first for
   an application failure. The migration is backward-compatible with it.
2. Schema rollback: run the existing schema rollback SQL only after the new
   application is no longer serving traffic and a schema rollback is required.
3. Username data restoration: never restore usernames automatically. It is
   independent of application and schema rollback and requires conflict review.

### Username restoration

Use this only after deciding to restore historical username data. If a
historical invalid username must be restored, run the schema rollback first:
the normalized-username constraint correctly rejects that old value. This
procedure does not alter RLS, roles, or grants.

Use a trusted PostgreSQL administrative client on the protected CSV. Do not
upload the CSV to a public SQL editor and do not create a permanent production
table. The staging table below is temporary and disappears at commit or
rollback.

~~~sql
begin;

create temporary table release_username_snapshot (
  id uuid primary key,
  username text,
  snapshot_at timestamptz not null,
  approved_for_restore boolean not null default false
) on commit drop;

-- In psql, load the protected local file without creating a permanent table:
-- \copy release_username_snapshot (id, username, snapshot_at) from '<PROTECTED_CSV_PATH>' with (format csv, header true)

-- Stop if any snapshot profile id no longer exists.
select snapshot.id
from release_username_snapshot as snapshot
left join public.profiles as profiles on profiles.id = snapshot.id
where profiles.id is null;

-- Stop and manually resolve historical case-insensitive duplicates.
select lower(username) as username_key, count(*) as duplicate_count
from release_username_snapshot
where username is not null
group by lower(username)
having count(*) > 1;

-- Stop and review rows changed after the migration's predictable result.
with duplicate_keys as (
  select lower(username) as username_key
  from release_username_snapshot
  where username is not null
  group by lower(username)
  having count(*) > 1
), candidates as (
  select
    snapshot.id,
    snapshot.username as snapshot_username,
    profiles.username as current_username,
    case
      when snapshot.username is null then null
      when snapshot.username ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$'
        then lower(snapshot.username)
      else null
    end as expected_after_migration,
    exists (
      select 1
      from duplicate_keys
      where duplicate_keys.username_key = lower(snapshot.username)
    ) as source_duplicate
  from release_username_snapshot as snapshot
  join public.profiles as profiles on profiles.id = snapshot.id
)
select *
from candidates
where source_duplicate
   or current_username is distinct from expected_after_migration;

-- Do not mass-approve rows. After reviewing conflict reports, approve only
-- individually reviewed profile ids:
-- update release_username_snapshot set approved_for_restore = true where id in ('<reviewed-profile-id>');

-- Approved values must not collide with another profile under lower(username).
select snapshot.id, snapshot.username, other_profiles.id as conflicting_profile_id
from release_username_snapshot as snapshot
join public.profiles as other_profiles
  on other_profiles.id <> snapshot.id
 and snapshot.username is not null
 and other_profiles.username is not null
 and lower(other_profiles.username) = lower(snapshot.username)
where snapshot.approved_for_restore;

-- Run only after every conflict query is empty and every id is approved.
update public.profiles as profiles
set username = snapshot.username
from release_username_snapshot as snapshot
where snapshot.approved_for_restore
  and profiles.id = snapshot.id
  and profiles.username is distinct from snapshot.username
  and profiles.username is not distinct from case
    when snapshot.username is null then null
    when snapshot.username ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$'
      then lower(snapshot.username)
    else null
  end;

-- Case-insensitive uniqueness must still hold after the approved update.
select lower(username) as username_key, count(*) as duplicate_count
from public.profiles
where username is not null
group by lower(username)
having count(*) > 1;

commit;
~~~

If any pre-update or final uniqueness query returns rows, execute rollback and
escalate for operator review. Do not weaken RLS, change roles, relax grants, or
bypass conflict checks to force a restoration.

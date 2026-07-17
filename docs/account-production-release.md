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

# Account offer dashboard: Phase 1

Phase 1 adds private, account-scoped favorites, recently viewed offers, and tracked offers. Each record uses the existing `source + UUID` identity, with a limited snapshot (title, image, payout, platform, country, devices, and a validated internal route). A stale record remains removable and cannot redirect to a different offer.

## Data and authorization

The local replay applied all 70 repository migrations, including `20260718120000_add_user_offer_dashboard.sql`. It creates `user_offer_favorites`, `user_offer_views`, and `user_offer_tracking`, each with an Auth-user cascade, per-user source/UUID uniqueness, a user/timestamp ordering index, RLS, no anonymous table grants, and only the required authenticated data privileges. The retention RPC is `SECURITY INVOKER`, has a pinned `search_path`, and keeps the newest 50 views for the calling user only.

`npm run test:account-dashboard-integration` is a real local Supabase integration test. `npm run test:account-dashboard-browser` runs the local Next.js app against that stack and verifies protected routing, per-user rendering, the removal server action, settings navigation, cache headers, and responsive overflow. It creates disposable users through local Auth, tests anonymous denial, real JWT-based own-record access, forged ownership denial, cross-user isolation, upsert idempotency, unsafe-route rejection, 55-view retention, and Auth-user cascading cleanup. It uses the service role only to create and remove local disposable fixtures; authorization assertions use anonymous or authenticated clients.

## Application behavior

Normal mutations use the session-bound server client and derive ownership from `auth.getUser()`; no ordinary application path imports a service role. Summary counts use exact totals while the dashboard renders the six newest items per collection. Saved paths accept only the existing `/offers/<slug>` and `/go/<uuid>`, `/go/earn/<uuid>`, or `/go/platform/<uuid>` contracts. Recent views are created only from the deliberate internal **View Route** action for signed-in users; rendering, search loading, prefetching, Favorite, and Track do not record a view.

Favorites are bookmarks. Tracking is a manual watchlist only; it does not send alerts. Phase 2 remains deferred: payout-change history, automated alerts, saved filters, completion tracking, recommendations, pagination/full management pages, and notification preferences.

## Validation and release prerequisites

Run `node scripts/test-account-offer-dashboard.mjs`, `npm run test:account-dashboard-integration`, `npm run test:account-dashboard-browser`, the account-auth guard, typecheck, lint, build, and a clean local Supabase reset before release. Deployment still requires the normal Preview review and a production migration plan; this phase does not change a remote Supabase project, Vercel configuration, or production data.
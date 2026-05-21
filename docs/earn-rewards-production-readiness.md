# EarnGrind Rewards Production Readiness

## Current Architecture

EarnGrind rewards are built around tracked offer clicks, provider postback receipts, conversion events, and a user reward ledger. Users must have an `earn_user_profiles` row before earning, and reward access is controlled by `reward_status`, `review_status`, and `accepted_rewards_terms_at`.

CPAlead is currently integrated as a beta hosted offerwall at `/earn/walls/cpalead`. The wall creates an EarnGrind `click_id`, passes it to CPAlead as `subid`, and expects provider postbacks at:

```text
https://earngrind.com/api/postbacks/cpalead
```

The hosted wall URL is built from the CPAlead-generated wall base URL plus the wall id. Example wall URL shape:

```text
https://zwidgetbv3dft.xyz/wall/wASj?subid=<click_id>
```

## Required CPAlead Environment Variables

```text
NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=false
CPALEAD_PUBLISHER_ID=
CPALEAD_WALL_BASE_URL=
CPALEAD_WALL_ID=
POSTBACK_PROVIDER_CPALEAD_SECRET=
```

`NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED` is a public UI availability flag only. Do not use it for secrets. Keep the CPAlead postback secret in `POSTBACK_PROVIDER_CPALEAD_SECRET`; the database should store only the secret env var name.

## CPAlead GET Password Risk

CPAlead GET postbacks can include `password` in the request URL before app code runs. EarnGrind redacts stored postback payloads and admin previews, but infrastructure, proxy, CDN, hosting, or framework access logs may capture full query strings.

Before sending real traffic, review Vercel/proxy/access-log behavior and ask CPAlead whether POST postbacks, header signatures, or IP-only validation are available. Do not treat application-level redaction as complete mitigation for URL-level secrets.

## Checklist Before Real Traffic

- Confirm `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=true` only in the intended environment.
- Confirm `CPALEAD_PUBLISHER_ID`, `CPALEAD_WALL_BASE_URL`, `CPALEAD_WALL_ID`, and `POSTBACK_PROVIDER_CPALEAD_SECRET` are set.
- Confirm CPAlead provider config stores `secret_env_var = POSTBACK_PROVIDER_CPALEAD_SECRET`, not the secret value.
- Confirm `/earn/wallet` requires rewards terms acceptance before wall access.
- Confirm `/earn/walls/cpalead` blocks users without accepted terms.
- Confirm `limited`, `suspended`, and `banned` reward profiles cannot open the wall.
- Confirm failed postbacks store redacted receipts only.
- Confirm duplicate CPAlead `lead_id` values do not duplicate ledger credit.
- Confirm hosting/proxy logs are reviewed for query-string exposure.

## Not Implemented Yet

EarnGrind does not implement cashouts, withdrawal requests, PayPal, Tremendous, KYC, tax forms, bank destinations, or automatic payouts yet.

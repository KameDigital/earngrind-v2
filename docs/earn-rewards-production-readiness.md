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
EARN_REWARDS_PRIVATE_BETA_ENABLED=false
EARN_REWARDS_PRIVATE_BETA_EMAILS=
CPALEAD_PUBLISHER_ID=
CPALEAD_WALL_BASE_URL=
CPALEAD_WALL_ID=
CPALEAD_POSTBACK_ALLOWED_IPS=34.69.179.33/32
```

`NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED` is a public UI availability flag only. Do not use it for secrets. CPAlead postbacks should not include a password, token, or secret in the URL. The provider config should use `secret_type = none`, `secret_env_var = null`, and a strict CPAlead relay IP allowlist.

`EARN_REWARDS_PRIVATE_BETA_ENABLED` and `EARN_REWARDS_PRIVATE_BETA_EMAILS` are server-only controls for allowlisted testing. Do not prefix them with `NEXT_PUBLIC_`, and do not put the CPAlead postback secret or any other secret in the allowlist.

## Private Beta Access

Use private beta mode to test CPAlead with selected accounts while public traffic remains disabled:

```text
NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=false
EARN_REWARDS_PRIVATE_BETA_ENABLED=true
EARN_REWARDS_PRIVATE_BETA_EMAILS=tester@example.com
```

The allowlist is comma-separated and matched case-insensitively against the logged-in user's email address. Private beta access still requires an active rewards profile, accepted rewards terms, valid CPAlead setup, and normal CPAlead provider config. Private beta is not a public launch; do not enable the public `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=true` flag until the launch decision is explicit.

## CPAlead Passwordless GET Postbacks

CPAlead GET postbacks can include `password` in the request URL if the saved dashboard URL contains `password={password}`. Do not use that URL shape. Infrastructure, proxy, CDN, hosting, or framework access logs may capture full query strings before EarnGrind app redaction runs.

Use this passwordless URL shape instead:

```text
https://earngrind.com/api/postbacks/cpalead?subid={subid}&lead_id={lead_id}&campaign_id={campaign_id}&campaign_name={campaign_name}&payout={payout}&currency=USD&status=approved
```

EarnGrind validates CPAlead with the configured `allowed_ip_ranges` and still applies receipt logging, payload redaction, replay protection, duplicate `lead_id` protection, conversion lifecycle rules, and manual admin review. This removes the URL-secret logging risk, but it does mean CPAlead access depends on the relay IP allowlist staying current.

## Checklist Before Real Traffic

- Confirm `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=true` only in the intended environment.
- For private beta, keep `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=false`, set `EARN_REWARDS_PRIVATE_BETA_ENABLED=true`, and allowlist only selected test-account emails.
- Confirm `CPALEAD_PUBLISHER_ID`, `CPALEAD_WALL_BASE_URL`, `CPALEAD_WALL_ID`, and `CPALEAD_POSTBACK_ALLOWED_IPS` are set.
- Confirm CPAlead provider config has `secret_type = none`, `secret_env_var = null`, and a non-empty `allowed_ip_ranges` list.
- Confirm the saved CPAlead dashboard postback URL does not include `password`, `token`, `secret`, or any other credential query parameter.
- Confirm `/earn/wallet` requires rewards terms acceptance before wall access.
- Confirm `/earn/walls/cpalead` blocks users without accepted terms.
- Confirm `limited`, `suspended`, and `banned` reward profiles cannot open the wall.
- Confirm failed postbacks store redacted receipts only.
- Confirm duplicate CPAlead `lead_id` values do not duplicate ledger credit.
- Confirm hosting/proxy logs are reviewed for query-string exposure before using any provider that requires URL secrets.

## Not Implemented Yet

EarnGrind does not implement cashouts, withdrawal requests, PayPal, Tremendous, KYC, tax forms, bank destinations, or automatic payouts yet.

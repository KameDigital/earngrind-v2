# EarnGrind Rewards Production Readiness

## Current Architecture

EarnGrind rewards are built around tracked offer clicks, provider postback receipts, conversion events, and a user reward ledger. Users must have an `earn_user_profiles` row before earning, and reward access is controlled by `reward_status`, `review_status`, and `accepted_rewards_terms_at`.

CPAlead is currently integrated as a beta hosted offerwall at `/earn/walls/cpalead`. The wall creates an EarnGrind `click_id` and passes it to CPAlead as `subid`.

CPAlead rewards are currently manual-credit only. Admins verify completions in the CPAlead publisher dashboard using `subid=<EarnGrind click_id>` and the CPAlead lead/reference id, then credit the matching EarnGrind click from `/app/admin/reward-support`.

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
```

`NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED` is a public UI availability flag only. Do not use it for secrets. In manual-credit mode, CPAlead postbacks should be disabled or saved as a no-query URL only. Do not save CPAlead macro query parameters against `earngrind.com`.

`EARN_REWARDS_PRIVATE_BETA_ENABLED` and `EARN_REWARDS_PRIVATE_BETA_EMAILS` are server-only controls for allowlisted testing. Do not prefix them with `NEXT_PUBLIC_`, and do not put the CPAlead postback secret or any other secret in the allowlist.

## Private Beta Access

Use private beta mode to test CPAlead with selected accounts while public traffic remains disabled:

```text
NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=false
EARN_REWARDS_PRIVATE_BETA_ENABLED=true
EARN_REWARDS_PRIVATE_BETA_EMAILS=tester@example.com
```

The allowlist is comma-separated and matched case-insensitively against the logged-in user's email address. Private beta access still requires an active rewards profile, accepted rewards terms, valid CPAlead setup, and normal CPAlead provider config. Private beta is not a public launch; do not enable the public `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=true` flag until the launch decision is explicit.

## CPAlead Manual Credit Mode

CPAlead GET postbacks put macro values in the request URL. A direct Vercel URL with `{subid}`, `{lead_id}`, `{campaign_name}`, or `{payout}` can expose those values in infrastructure, proxy, CDN, hosting, or framework logs before EarnGrind app redaction runs.

For manual-credit mode, keep CPAlead postbacks disabled if possible. If CPAlead requires a saved URL, use this no-query URL only:

```text
https://earngrind.com/api/postbacks/cpalead
```

This endpoint will not credit rewards without the required postback fields. Admins should credit verified completions manually from `/app/admin/reward-support` using the EarnGrind `click_id` and a unique CPAlead lead/reference id. Manual credits use the original `offer_clicks.user_reward_cents` snapshot and write conversion, ledger, support-ticket, and audit records.

## Checklist Before Real Traffic

- Confirm `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=true` only in the intended environment.
- For private beta, keep `NEXT_PUBLIC_EARN_CPALEAD_WALL_ENABLED=false`, set `EARN_REWARDS_PRIVATE_BETA_ENABLED=true`, and allowlist only selected test-account emails.
- Confirm `CPALEAD_PUBLISHER_ID`, `CPALEAD_WALL_BASE_URL`, and `CPALEAD_WALL_ID` are set.
- Confirm CPAlead provider config is paused for automatic postbacks and does not allow direct GET crediting.
- Confirm the saved CPAlead dashboard postback URL does not include `{subid}`, `{lead_id}`, `{campaign_id}`, `{campaign_name}`, `{payout}`, `password`, `token`, `secret`, or any other macro/credential query parameter.
- Confirm admins can manually credit a verified CPAlead completion from `/app/admin/reward-support`.
- Confirm `/earn/wallet` requires rewards terms acceptance before wall access.
- Confirm `/earn/walls/cpalead` blocks users without accepted terms.
- Confirm `limited`, `suspended`, and `banned` reward profiles cannot open the wall.
- Confirm duplicate CPAlead lead/reference values do not duplicate ledger credit.
- Confirm hosting/proxy logs are reviewed before ever re-enabling automatic provider postbacks.

## Not Implemented Yet

EarnGrind does not implement cashouts, withdrawal requests, PayPal, Tremendous, KYC, tax forms, bank destinations, or automatic payouts yet.

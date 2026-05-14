# EarnGrind Audit Tools

Dependency-free local CLI for saving public-page research artifacts in a consistent shape.

Run through npm:

```powershell
npm run earngrind-audit -- init https://example.com
npm run earngrind-audit -- add-source example-com https://example.com/faq --note "Explains cashout options"
npm run earngrind-audit -- add-fact example-com --type "withdrawals" --claim "PayPal is listed as a withdrawal option." --url "https://example.com/faq" --evidence "FAQ text or research/example-com/screenshots/faq.png" --confidence high
npm run earngrind-audit -- screenshot example-com https://example.com --name "homepage"
npm run earngrind-audit -- screenshot example-com https://example.com/faq --name "faq-mobile" --mobile
npm run earngrind-audit -- validate example-com
npm run earngrind-audit -- summary example-com
```

The CLI writes to `research/<site-slug>/` and does not modify the database or require authenticated provider access.
Screenshot capture uses Playwright when available in the repo, saves PNG files under `research/<site-slug>/screenshots/`, and appends source/evidence notes to `sources.md` and `facts.json`.

Use screenshots only for public pages. Do not use this tool to bypass paywalls, logins, bot protections, or private areas.

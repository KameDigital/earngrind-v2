# EarnGrind Agent Rules

These rules apply to Codex work in this repository.

## Scope

- Treat EarnGrind as a Next.js App Router, TypeScript, and Supabase project.
- Follow existing conventions in `src/`, `workers/`, `scripts/`, and `supabase/` before introducing new patterns.
- Do not make database schema, migration, RLS, or Supabase data changes unless the user explicitly asks for them.
- Keep unrelated dirty-worktree files out of scope. Inspect before editing and do not revert user changes.

## SEO Research Guides

- Public-page audits only unless the user explicitly says login is allowed.
- Every important guide claim must be backed by at least one source URL, screenshot path, or extracted text record.
- Do not include generic filler sections.
- Do not invent payouts, deadlines, provider rules, bonuses, withdrawal information, eligibility terms, or requirements.
- Mark uncertain claims as uncertain and explain what evidence is missing.
- Prefer direct evidence from public provider pages, EarnGrind pages, public help docs, screenshots, and extracted text.
- Preserve raw evidence in `research/` when a guide depends on it.

## Guide Output Contract

Final guide output should include:

- SEO title.
- Meta description.
- Article draft.
- FAQ candidates.
- Source list.
- Screenshot references.
- Notes for uncertain or conflicting evidence.

## Validation

When code changes are made, validate with:

```powershell
npx tsc --noEmit
npm run build
npm run lint
```

For documentation-only workflow changes, report that code validation was not run because no runtime code changed.

## Repository Identity and Local Execution

- Before each command group, verify `git rev-parse --show-toplevel` resolves to `C:/Users/kamed/Dev/earn-terminal-v2/earngrind-v2`.
- Do not run Supabase, MCP, or other remote-service commands unless the user explicitly authorizes a verified target environment.
- Use visible foreground processes only. Do not use hidden PowerShell, generated launch scripts, ExecutionPolicy Bypass, or background server orchestration.
- Treat temporary worktrees as preservation-only unless the user explicitly scopes them for work.

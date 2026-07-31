# AGENTS.md

Guidance for AI coding agents (Claude, Cursor, or others) working in this repository. Read `README.md` first for the project overview; this file covers how to work in the codebase safely and consistently.

## What this is

Astro 6 static blog for James F. McGrath (jamesfmcgrath.org), migrated from WordPress. No backend, no database — content is Markdown in `src/content/`, and the build output is static HTML deployed to Hostinger.

## Setup and verification commands

Always use the pinned Node version before running anything:

```bash
nvm use   # reads .nvmrc (currently v22.22.2)
npm ci
```

Before considering a change done, run:

```bash
npm run build      # must exit 0 — watch for image-resolution or routing warnings
npm test           # unit tests + Playwright layout tests
npm run a11y       # axe accessibility sweep, light + dark themes — must report zero violations
```

`npm test` and `npm run a11y` both boot `astro preview` on `localhost:4321` via Playwright. Don't run anything else on that port at the same time, and expect a few seconds for each script to spin its preview server up and down.

### Known environment quirk

If you are running as root inside a bare Linux container with no sandbox, `chromium.launch()` with no arguments can hang indefinitely instead of failing. This is a container-only quirk, not a project bug — Playwright's default launch expects an unprivileged user. If tests hang in that kind of environment, verify against a scratch copy launched with `{ args: ['--no-sandbox'] }` rather than editing the committed test files; they run fine as-is on a normal (non-root) machine.

## Code conventions

- Tabs for indentation, single quotes, semicolons — match the surrounding file, don't reformat wholesale.
- CSS sizing uses `rem`, not `px` (moved over deliberately in the "SiteImprove AAA" accessibility pass so zoom/OS text-scaling works). Keep new styles consistent.
- Design tokens (colors, fonts) live in `src/styles/global.css` as CSS custom properties (`--text`, `--muted`, `--accent`, `--border`, `--font-zen-kaku`, `--font-inter`, etc.). Reference the token in component `<style>` blocks rather than hardcoding a color or font.
- `tsconfig.json` extends `astro/tsconfigs/strict` with `strictNullChecks` — keep new `.astro`/`.ts` frontmatter typed accordingly.
- Content collection schemas live in `src/content.config.ts`: `blog` requires `title`, `date`, `slug`, optional `excerpt`/`image`; `pages` requires `title`, optional `date`. If you add a field, update the schema and the content files together.

## Planning and specs

This repo follows a spec → plan → implementation workflow under `docs/superpowers/`:

- `docs/superpowers/specs/` — dated design/requirements documents, one per unit of work
- `docs/superpowers/plans/` — dated, task-by-task implementation plans with checkboxes, each naming its spec as the source of truth

Past plans include a "Global Constraints" section (things that must **not** change — token hex values, specific breakpoints, etc.) and end with a spec-coverage self-review table. Follow that pattern for new non-trivial work: write or update a spec, then a plan, before changing code, and make constraints explicit rather than assumed.

Before starting non-trivial work, check `docs/superpowers/` for an existing spec or plan covering it. Past rounds of work — the WordPress migration, the visual-audit alignment, the SiteImprove accessibility pass — are documented there and explain *why* the code looks the way it does, not just what it does.

## Guardrails

- **Do not deploy, and do not touch deploy secrets.** `.github/workflows/deploy.yml` is manual-dispatch-only and its five required secrets (`DEPLOY_PATH`, `SSH_KEY`, `SSH_HOST`, `SSH_PORT`, `SSH_USER`) are intentionally unset. Leave it that way unless explicitly asked to wire up deployment.
- **Match the install environment to the actual target machine.** This project has already hit a broken build (`@rollup/rollup-linux-arm64-gnu` missing) from running `npm install` against this macOS checkout inside a Linux container. If you need to verify a build outside the checkout's own machine, copy the source elsewhere first — don't run `npm install`/`npm ci` in place through a bridged filesystem from a different OS.
- This project is being used to compare AI coding agents on the same codebase. If you make a commit, credit yourself honestly with a trailer, e.g. `Co-authored-by: <Agent Name> <email>`, matching the existing convention visible in `git log`.
- `.claude/worktrees/` may contain other agents' git worktrees for parallel sessions. It's gitignored and machine-local — don't treat its contents as authoritative for the state of `main`.

## Testing expectations

New front-end behavior should get a Playwright assertion in `tests/front-end-layout.test.mjs` (pattern: boot `astro preview`, assert computed styles or DOM state) rather than relying on visual inspection alone. New non-browser logic (scripts, data transforms) should get a `node:test` file alongside the existing ones in `tests/`.

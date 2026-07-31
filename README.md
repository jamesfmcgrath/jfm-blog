# James F. McGrath — Blog

Personal blog and site for James F. McGrath (jamesfmcgrath.org), covering Drupal, accessibility, and web development. Built with Astro and migrated from WordPress in July 2026. Deployed as a static build to Hostinger.

## Stack

- **Astro 6** — static output, content collections, built-in image optimization
- **Content** — Markdown, no CMS. Posts and one standalone page, migrated from a WordPress export
- **Fonts** — Inter (via Astro's font API, Google provider)
- **Testing** — Node's built-in test runner (`node:test`) for unit tests, Playwright for layout/behavior assertions, axe-core for accessibility
- **Deploy target** — Hostinger shared hosting over rsync/SSH, triggered manually via GitHub Actions

## Getting started

This project pins a Node version in `.nvmrc` (currently v22.22.2). Use it before installing or running anything:

```bash
nvm use
npm ci
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Static build to `dist/` |
| `npm run preview` | Serve the built `dist/` output locally |
| `npm test` | Unit tests + Playwright layout tests (`tests/*.test.mjs`) |
| `npm run a11y` | `scripts/a11y-check.mjs` — axe accessibility sweep of the built pages, light and dark themes |

## Project structure

- `src/content/blog/` — blog posts (Markdown), migrated from WordPress; images live alongside in `src/content/blog/images/`
- `src/content/pages/` — standalone pages (currently one: `learn-javascript-for-beginners.md`)
- `src/content.config.ts` — content collection schemas (`blog`, `pages`)
- `src/components/` — `Header`, `Footer`, `BaseHead`, `FormattedDate`
- `src/layouts/` — `BlogPost.astro`, `Page.astro`
- `src/pages/` — routes, including `[...slug].astro` (dynamic blog/page routing), `blog/index.astro` (archive), `rss.xml.js`
- `src/styles/global.css` — design tokens (colors, fonts) and global rules
- `scripts/migrate-wordpress/` — one-off scripts used for the WordPress → Astro migration (filtering the export XML, building `.htaccess` redirects for retired attachment URLs); not part of the normal build
- `scripts/a11y-check.mjs` — accessibility check script
- `tests/` — unit tests and Playwright layout tests
- `docs/superpowers/plans/` and `docs/superpowers/specs/` — design specs and implementation plans for past and future work (see `AGENTS.md`)
- `.github/workflows/deploy.yml` — manual, dry-run-by-default deploy to Hostinger

## Content

Posts and the page were migrated from a WordPress export (via `wordpress-export-to-markdown`) on 2026-07-27. `docs/superpowers/plans/2026-07-27-migration-report.md` documents exactly what was converted, what was hand-fixed afterward (corrupted code blocks, a mis-linked image, unescaped HTML entities in titles), and what deliberately did not carry over.

## Deployment

`.github/workflows/deploy.yml` deploys the `dist/` build to Hostinger over rsync/SSH. It runs only on manual `workflow_dispatch`, defaults to a dry run, and has no push trigger. It requires five repository secrets — `DEPLOY_PATH`, `SSH_KEY`, `SSH_HOST`, `SSH_PORT`, `SSH_USER` — which are **not yet configured**. The site has not been deployed live from this repo yet.

## Working on this project with an AI coding agent

See `AGENTS.md`.

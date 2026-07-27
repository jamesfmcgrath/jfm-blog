# jamesfmcgrath.org: WordPress to Astro migration

Date: 2026-07-27
Status: Approved, not yet implemented. Deploy explicitly withheld until requested.

## Purpose

Rebuild jamesfmcgrath.org as a static Astro site, replacing WordPress, using the
design captured in `James F. McGrath blog design.zip` (a claude.ai design-tool
export, `Blog.dc.html`) as the visual and structural spec. Migrate existing
content from a WordPress export XML. Deploy to the same Hostinger account that
already hosts muirriasc.com, reusing its GitHub Actions + rsync-over-SSH
pattern.

This is a companion site to muirriasc.com (`/Users/jamesmcgrath/Projects/muirriasc`),
which deploys to Hostinger shared hosting via `.github/workflows/deploy.yml`
using repo secrets `SSH_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `DEPLOY_PATH`.

## Source material

- `jamesmcgrath.WordPress.2026-07-27.xml` (repo root): WordPress "Tools > Export"
  file. 222 `<item>` entries total, but only a subset is real content:
  - 33 `post` items, all `status: publish`, flat permalinks
    (`https://jamesfmcgrath.org/{slug}/`, no date or category prefix)
  - 7 `page` items: `Home` (`/`) and `Blog` (`/blog/`) are published; `Contact
    (Theme)`, `About (Theme)`, `Full Width Template (Theme)`, `Blank (Theme)`
    are drafts (theme scaffolding, not real pages); `Learn JavaScript One Day
    at a Time` (`/learn-javascript-for-beginners/`) is published and is real
    content
  - 48 `attachment` items (media library entries; images referenced from
    `wp-content/uploads/...` on the still-live site)
  - 124 `wpa-stats` items (a stats/analytics plugin's internal records, not
    content) and a handful of `wp_global_styles` / `wp_navigation` /
    `wp_template` / `wp_template_part` items (block-theme scaffolding, not
    content)
  - Everything except the 33 posts, `Home`, `Blog`, and the JS page is
    discarded during migration.
- `James F. McGrath blog design.zip` (repo root, already extracted and
  reviewed): a `.dc.html` design-tool mockup (`{{ }}` bindings, `sc-if`/`sc-for`
  directives, a `Component extends DCLogic` state class) with a `MOCKUP
  VIEW` demo chrome, four views, and a `Tokens` reference page. The demo chrome
  and Tokens page are QA aids for the design tool, not part of the real site;
  the token values and page structures below are extracted from it.

## Design tokens

Light theme: `bg #F7F3EC`, `text #211F1C`, `muted #5B564D`, `accent #2F4157`,
`border #E4DFD3`, `codeBg #EFEAE0`.

Dark theme: `bg #1B1912`, `text #EDE8DF`, `muted #A8A192`, `accent #9DB4D4`,
`border #332F26`, `codeBg #211E16`.

Typography:
- Body: `Source Serif 4` (fallback Georgia, serif), 18px / 1.75 line-height,
  content max-width ~640px (62-65ch at 18px).
- Headings & UI: `Zen Kaku Gothic New` (sans-serif), 500 weight.
- Code: `JetBrains Mono` (monospace), 14px / 1.65.
- All three self-hosted via Astro's `fontProviders.google()` (build-time
  download, no third-party request at runtime), matching how muirriasc
  self-hosts Atkinson via `fontProviders.local()`.

Spacing & shape: 2px border-radius everywhere (flat, no decorative rounding),
36-64px vertical section rhythm.

Theme switching: real light/dark toggle (not mockup-only), defaulting to
`prefers-color-scheme` and persisting the user's explicit choice.

Accessibility features already present in the mockup, to be carried over
as real behaviour: skip-to-content link, visible focus outlines on every
interactive element (`2px solid accent`, appropriate offset), semantic
heading hierarchy, `aria-label`s on nav landmarks.

## Site structure

- `/` — home: intro line, list of recent posts (title, date, excerpt), link to
  archive.
- `/blog/` — archive: full reverse-chronological post list (title + date).
- `/{slug}/` — individual post: title, date, reading time, body, prev/next
  post navigation. Flat under root, matching every existing WordPress post
  URL exactly (`right-sizing-government-websites`, etc.) — decided
  deliberately over namespacing under `/blog/{slug}/` so that zero posts
  need a redirect.
- `/learn-javascript-for-beginners/` — migrated as a page at its existing URL.
- No `Tokens` page in the real site; it was a design-tool QA aid only.

## Content migration

Tool: `wordpress-export-to-markdown` (or equivalent) run against the XML
export, producing one markdown file per post/page under `src/content/blog/`
with frontmatter `title`, `date`, `slug` (excerpt derived or hand-written
where missing).

Images: referenced attachments are downloaded from the still-live
jamesfmcgrath.org (`wp-content/uploads/...` URLs in the export) into
`src/assets/`, and post bodies are rewritten to reference the local copies.
No hotlinking to the old media library in the shipped site.

Manual-review flag: any post whose body contains shortcodes (`[...]`),
embeds, or raw HTML the converter can't cleanly map to markdown/MDX is
recorded in a migration report (list of slugs + reasons) rather than having
that content silently stripped or dropped.

Excluded from migration: attachments-as-posts (48 items, e.g.
`/mt-sample-background/`), `wpa-stats` (124 items), draft theme-scaffold
pages, block-theme (`wp_global_styles`/`wp_navigation`/`wp_template*`) items.

## Redirects

Because posts keep their exact existing flat URLs and `/blog/` keeps its
existing URL, no redirect is required for the 33 posts or the two structural
pages. A redirect map is still produced for anything that doesn't survive
1:1 — chiefly the 48 attachment permalinks (e.g. `/mt-sample-background/`,
which WordPress gave their own page) and any slug that has to change during
cleanup. Implemented as a `.htaccess` (`RedirectMatch`/`Redirect` directives)
placed in `public/.htaccess`, which Astro copies unchanged into `dist/` for
Hostinger's Apache to serve — no server-side logic needed beyond that.

## Accessibility verification

`@axe-core/playwright` (or equivalent) run against the built `dist/` output
for each of the four page templates (home, archive, post, the JS page)
before any page is considered done. Target: WCAG 2.1 AA, zero violations.
This is a local pre-completion check for now, not wired into CI as a merge
gate — can be added to CI later if wanted.

## Deploy

New `.github/workflows/deploy.yml` on `jfm-blog`, structurally mirroring
muirriasc's (`actions/checkout` → `setup-node` → `npm ci` → `astro build` →
verify `dist/` non-empty → verify `DEPLOY_PATH` → SSH setup → verify
destination writable → dry-run rsync → real rsync gated on manual
`workflow_dispatch` input), with one addition: the `DEPLOY_PATH` guard step
must also reject any value that does not contain the literal substring
`jamesfmcgrath.org`, on top of muirriasc's existing
`/home/*/domains/*/public_html` shape check. This directly targets the prior
muirriasc incident (empty `DEPLOY_PATH` widening an `rsync --delete` target)
and additionally guards against the new failure mode unique to sharing one
Hostinger account across two sites: a valid-shaped but wrong-domain path.

Secrets: reuse the existing `muirriasc_deploy` SSH key
(`~/.ssh/muirriasc_deploy`) and the same `SSH_HOST`/`SSH_USER`/`SSH_PORT`
values as muirriasc, added as new secrets on the `jfm-blog` repo (secrets are
per-repo, confirmed via `gh secret list` — muirriasc's are not visible/shared
automatically). `DEPLOY_PATH` for jfm-blog is expected to be
`/home/u813933409/domains/jamesfmcgrath.org/public_html`, but this is
confirmed by the user (via Hostinger hPanel or their own SSH check) before
being set as a secret, not assumed from the initial request.

Setting repo secrets and running the workflow are both treated as actions
requiring explicit confirmation at the time, not implied by this design's
approval:
- Confirm before running `gh secret set` against the `jfm-blog` repo.
- Confirm before the first dry-run.
- Confirm before the first real deploy (rsync with `--delete` against a live
  production path).
- **No deploy of any kind happens until the user explicitly asks for it.**

## Testing plan

1. `astro build` locally after scaffold and after content migration; visually
   check all four page types in light and dark mode.
2. Run the axe accessibility check against the built output.
3. Review the migration report (flagged shortcodes/embeds, excluded items)
   by hand.
4. Only once the above pass: prepare (but do not run) the deploy workflow,
   present a dry-run rsync output for review, and wait for explicit
   go-ahead before any real deploy.

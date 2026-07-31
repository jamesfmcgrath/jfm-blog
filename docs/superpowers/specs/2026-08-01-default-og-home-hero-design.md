# Default OG image + home hero

Date: 2026-08-01
Status: Approved design; awaiting implementation plan.

## Purpose

Use `james-and-a-monkey.png` as the site-wide social-share fallback and as a
full-bleed hero on the home page.

## Decisions

| Topic | Choice |
|-------|--------|
| Social share behaviour | **Fallback only** — pages without an image prop use the monkey photo; posts that already pass a featured image keep theirs |
| Home hero placement | Under header, **constrained to `65ch`** (same reading width as excerpts), then intro + recent posts |
| Asset location | Site-level under `src/assets/` (not tied to a blog post entry) |

## Asset

Source file already in the repo: `src/content/blog/images/james-and-a-monkey.png`
(1200×630 PNG). Implementation moves or copies it to
`src/assets/james-and-a-monkey.png` and commits that canonical path. Remove the
copy under `src/content/blog/images/` if it was only staged for this purpose
(do not leave two competing sources).

Also ignore / leave untracked any scratch files at repo root (e.g.
`og-monkey-scene-bw_1.png`) unless the user asks to use them.

## Social shares

1. Build a default OG image once at build time with Astro `getImage` (width
   1200, JPEG), same pattern as `BlogPost.astro` for post featured images.
2. Centralise the default (e.g. export from `src/consts.ts` or a tiny
   `src/lib/og-default.ts` helper that returns the optimized `src` string).
3. Update `BaseHead.astro` so:
   - If `image` prop is provided → use it (current behaviour).
   - If `image` is omitted → use the default OG `src`.
4. Home (`index.astro`), archive (`blog/index.astro`), and any other pages that
   currently omit `image` then automatically get the monkey photo in
   `og:image` / `twitter:image` and `summary_large_image`.
5. Posts that pass `ogImage?.src` from frontmatter keep their own preview.

## Home hero

1. On `src/pages/index.astro`, render the photo with Astro `<Image>` at the
   top of `<main>` before `.intro`, inside the existing side padding.
2. Constrain the hero to `max-width: 65ch` so it matches the reading width used
   by excerpts / prose (not full-bleed).
3. No card chrome, overlays, badges, or required caption.
4. Suggested `alt`: `James with a monkey` (adjustable if the user prefers
   different wording).
5. Decorative/atmosphere role: do not put interactive controls on the image.

## Out of scope

- Forcing the monkey photo on posts that already have featured images
- Heroes on archive or post templates
- Redesigning home intro / post list beyond inserting the hero
- Privacy / analytics changes

## Testing

1. Build without errors; optimized asset appears under `dist/_astro/`.
2. Home HTML includes a hero `<img>` (or picture) in `<main>` before the intro,
   with the hero container capped at `65ch`.
3. Home and `/blog/` meta tags include `og:image` pointing at the default
   optimized asset.
4. A post with frontmatter `image` still emits its own `og:image`, not the
   default.
5. Spot-check light/dark: hero is a photo; no theme-toggle regressions.

## Success criteria

- Sharing the home or archive URL shows the monkey photo in link previews.
- Sharing a post with a featured image still shows that post’s image.
- Home page opens with a `65ch`-wide hero of that photo, then the existing
  content rhythm.

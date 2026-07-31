# Default OG image (no home hero)

Date: 2026-08-01
Status: Approved; home hero removed after review — OG fallback only.

## Purpose

Use `james-and-a-monkey.png` as the site-wide social-share fallback when a page
has no image of its own. Do **not** show the photo as a home-page hero.

## Decisions

| Topic | Choice |
|-------|--------|
| Social share behaviour | **Fallback only** — pages without an image prop use the monkey photo; posts that already pass a featured image keep theirs |
| Home hero | **None** — removed; home layout stays intro + recent posts |
| Asset location | Site-level under `src/assets/` (not tied to a blog post entry) |

## Asset

Canonical path: `src/assets/james-and-a-monkey.png` (1200×630 PNG).

Also ignore / leave untracked any scratch files at repo root (e.g.
`og-monkey-scene-bw_1.png`) unless the user asks to use them.

## Social shares

1. Build a default OG image once at build time with Astro `getImage` (width
   1200, JPEG), same pattern as `BlogPost.astro` for post featured images.
2. Update `BaseHead.astro` so:
   - If `image` prop is provided → use it.
   - If `image` is omitted → use the default OG `src`.
3. Home, archive, and any other pages that omit `image` get the monkey photo in
   `og:image` / `twitter:image` and `summary_large_image`.
4. Posts that pass `ogImage?.src` from frontmatter keep their own preview.

## Out of scope

- Home-page hero (explicitly declined)
- Forcing the monkey photo on posts that already have featured images
- Heroes on archive or post templates
- Privacy / analytics changes

## Testing

1. Build without errors; optimized default OG asset under `dist/_astro/`.
2. Home HTML has **no** hero markup for this photo.
3. Home and `/blog/` meta tags include `og:image` pointing at the default
   optimized asset.
4. A post with frontmatter `image` still emits its own `og:image`, not the
   default.

## Success criteria

- Sharing the home or archive URL shows the monkey photo in link previews.
- Sharing a post with a featured image still shows that post’s image.
- Home page has no on-page hero for this image.

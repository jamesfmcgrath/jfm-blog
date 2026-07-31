# Visual audit alignment with Blog.dc.html mockup

Date: 2026-07-31
Status: Approved design; awaiting implementation plan.

## Purpose

Bring the Astro front end into pixel/token alignment with
`James F. McGrath blog design/Blog.dc.html` for home, archive, and post —
fixing only true mismatches found in a Playwright computed-style audit.
Intentional deviations (nav theme toggle, post hero images) stay.

## Out of scope

- Expanding post prose styles (lists, images, blockquotes, etc.)
- Moving or removing the theme toggle from main nav
- Removing or restyling post hero images
- Token value changes (colours already match light/dark mockup tokens)
- Layout restructure (reading column / padding already match mockup)

## Audit findings (1280×900, light mode)

Already matching: colour tokens, header/main/footer padding, 640px content
column, home post preview spacing, archive list layout, post chrome
(back link, h1, meta, prose p/h2, post-nav).

Mismatches to fix:

| Location | Mockup | Live | Cause |
|----------|--------|------|-------|
| Archive `<time>` | 13px Zen Kaku, muted | 18px Source Serif, body colour | Astro scoped CSS: `li time` does not pierce child component |
| Home intro | `letter-spacing: 0.02em` | `normal` | Omitted from `index.astro` |
| Home post title h2 | `line-height: 1.35` | `1.3` | Global `h1–h6` rule wins |

## Approach

Surgical CSS fixes in the two page files that own the mismatched rules.
No new components, no shared token extraction.

## Changes

### 1. `src/pages/blog/index.astro`

Replace the archive date selector so styles apply to `FormattedDate`'s
`<time>` root:

```css
li :global(time) {
	font-family: var(--font-zen-kaku);
	font-size: 13px;
	color: var(--muted);
	white-space: nowrap;
}
```

Values unchanged from the existing (broken) `li time` rule; only the
selector changes.

### 2. `src/pages/index.astro`

On `.intro p`, add:

```css
letter-spacing: 0.02em;
```

On `.post-preview h2`, add:

```css
line-height: 1.35;
```

## Verification

Re-run a Playwright style check (or equivalent) against:

- `/blog/` — first `li time`: font-size 13px, Zen Kaku family, muted colour
- `/` — `.intro p` letter-spacing ≈ 0.02em; `.post-preview h2` line-height 1.35

Optional: side-by-side screenshot of mockup vs live for home and archive;
no visual regression expected on post beyond unchanged heroes/toggle.

## Success criteria

- The three audited mismatches are resolved
- Heroes and theme toggle remain
- No other front-end behaviour changes

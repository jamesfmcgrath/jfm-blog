# Visual audit alignment with Blog.dc.html mockup

Date: 2026-07-31
Status: Approved design; awaiting implementation plan.

## Purpose

Align the Astro front end with the `Blog.dc.html` mockup where it still
matches intent, and deliberately improve chrome and layout where the live
site should diverge:

1. Fix three CSS mismatches from a Playwright computed-style audit
2. Remove the manual theme toggle; follow OS light/dark preference
3. Use fluid content width (side padding only) so large screens are not
   dominated by empty space to the right of a 640px column
4. Collapse main nav into a hamburger disclosure below 900px

Post hero images stay (intentional addition beyond the mockup).

## Out of scope

- Expanding post prose styles beyond what is needed for the width change
  (lists, images, blockquotes keep existing / UA styling)
- Removing or restyling post hero images
- Token value changes (colours already match light/dark mockup tokens)
- Overlay / drawer navigation (disclosure panel only)
- A Tokens reference page (mockup QA aid only)

## Decisions (from review)

| Topic | Choice |
|-------|--------|
| Visual audit focus | Home / archive / post token & layout alignment |
| Theme toggle | Removed from chrome |
| Dark mode | OS `prefers-color-scheme` only (incl. live `change`) |
| Content width | Fluid — no 640px cap; keep `8vw`/`10vw` side padding |
| Line length | `max-width: 65ch` on body/excerpt reading text only |
| Mobile nav | Hamburger below 900px; simplest accessible pattern |
| Menu pattern | Inline disclosure under header (no overlay) |
| Heroes | Keep |

## Audit findings (1280×900, light mode) — still valid

Already matching before this work: colour tokens, header/main/footer
padding values, home post preview spacing (within the old column),
archive list rhythm, post chrome (back link, h1, meta, prose p/h2,
post-nav).

CSS mismatches to fix:

| Location | Mockup | Live | Cause |
|----------|--------|------|-------|
| Archive `<time>` | 13px Zen Kaku, muted | 18px Source Serif, body colour | Astro scoped CSS: `li time` does not pierce child component |
| Home intro | `letter-spacing: 0.02em` | `normal` | Omitted from `index.astro` |
| Home post title h2 | `line-height: 1.35` | `1.3` | Global `h1–h6` rule wins |

Layout / chrome changes (intentional vs mockup):

| Location | Mockup | Target |
|----------|--------|--------|
| Content column | `max-width: 640px`, left-flush | No max-width on wrappers; padding only |
| Reading text | ~62–65ch via 640px box | Explicit `max-width: 65ch` on excerpts / `.prose` |
| Theme toggle | Demo bar only | Absent; OS preference |
| Nav < 900px | Always horizontal (wrap) | Hamburger + disclosure |

## Approach

Surgical CSS fixes for the three audit items; remove toggle and simplify
theme init; drop wrapper max-widths and add `65ch` on reading text;
implement an accessible hamburger disclosure in `Header.astro`.

## Changes

### 1. `src/pages/blog/index.astro`

- Replace `li time` with `li :global(time)` (same 13px Zen Kaku / muted /
  nowrap values) so styles reach `FormattedDate`.
- Remove `.archive { max-width: 640px; }` (keep vertical padding).
- Archive row titles remain full width of the padded main; dates stay
  right-aligned in the flex row.

### 2. `src/pages/index.astro`

- On `.intro p`: add `letter-spacing: 0.02em`.
- On `.post-preview h2`: add `line-height: 1.35`.
- Remove `max-width: 640px` from `.intro` and `.posts`.
- On `.post-preview .excerpt`: set `max-width: 65ch` (replacing `62ch` if
  present). Intro line stays full padded width (short UI line).

### 3. `src/layouts/BlogPost.astro` and `src/layouts/Page.astro`

- Remove `.post` / `.page` `max-width: 640px`.
- On `.prose`: add `max-width: 65ch` so body copy does not span the full
  ultrawide viewport. Title, meta, back link, hero, and post-nav use the
  full padded width (hero may be wide; that is acceptable).

### 4. `src/components/Header.astro`

- Remove `#theme-toggle` button, its CSS, and the click/`localStorage`
  script.
- Structure (semantic sketch):

  ```html
  <header>
    <a class="site-title" href="/">…</a>
    <button type="button" class="nav-toggle"
      aria-expanded="false" aria-controls="site-nav">
      Menu
    </button>
    <nav id="site-nav" aria-label="Main">
      <a href="/">Home</a>
      <a href="/blog/">Writing</a>
      <a href="https://jfmdigitalworks.com">JFM Digital Works</a>
    </nav>
  </header>
  ```

- **≥900px:** toggle button `display: none`; nav is the existing
  horizontal flex row (`gap: 28px`).
- **<900px:** toggle visible; nav hidden when `aria-expanded="false"`,
  shown as a full-width block under the title row when open (column of
  links, same Zen Kaku 15px). Header may use a wrap / grid so the
  disclosure sits below the title+button row.
- JS (inline or small module): toggle `aria-expanded` on click; close on
  Escape when open; on `resize` crossing ≥900px, force closed
  (`aria-expanded="false"`) so desktop never stays “stuck open” with
  mobile styles if the viewport grows.
- Visible focus outline remains (global `:focus-visible` / accent).
- Button label: visible text “Menu” (or “Menu” / “Close” reflecting
  state). Prefer text over icon-only for clarity; a simple CSS
  hamburger affordance may accompany the text but must not be the sole
  name.

### 5. `src/components/BaseHead.astro`

Theme init — OS only, no `localStorage`:

```js
(function () {
	function apply() {
		var theme = window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light';
		document.documentElement.dataset.theme = theme;
	}
	apply();
	window
		.matchMedia('(prefers-color-scheme: dark)')
		.addEventListener('change', apply);
})();
```

Stale `localStorage.theme` values from prior visits are ignored.

### 6. `src/styles/global.css`

No token changes required. Breakpoint is hardcoded as `900px` in Header
media queries (custom properties cannot be used as media-query bounds in
plain CSS).

## Verification

- `/blog/` — first `li time`: 13px, Zen Kaku, muted
- `/` — intro `letter-spacing` ≈ 0.02em; `.post-preview h2` line-height 1.35
- Width at 1280 / 1440 / 2560: content wrappers are not capped at 640px;
  main uses `0 8vw 0 10vw`; `.prose` / excerpts compute ≤65ch
- No `#theme-toggle`; nav has three links
- Viewport <900px: hamburger present; links hidden until expanded;
  Escape closes; focus outline visible on toggle and links
- Viewport ≥900px: no hamburger; horizontal nav
- `prefers-color-scheme: dark` → `data-theme="dark"`; light likewise;
  `localStorage.theme` does not override
- `npm run a11y` passes (script may still set `dataset.theme` for checks)

## Success criteria

- Three audited CSS mismatches resolved
- Theme toggle gone; theme tracks OS preference
- Content uses fluid width with side padding; reading text capped at 65ch
- Hamburger disclosure works below 900px
- Heroes remain
- No unrelated front-end behaviour changes

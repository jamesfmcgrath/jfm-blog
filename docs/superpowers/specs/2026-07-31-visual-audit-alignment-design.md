# Visual audit alignment with Blog.dc.html mockup

Date: 2026-07-31
Status: Approved design; awaiting implementation plan.

## Purpose

Bring the Astro front end into pixel/token alignment with
`James F. McGrath blog design/Blog.dc.html` for home, archive, and post —
fixing mismatches found in a Playwright computed-style audit, and aligning
site chrome with the mockup by removing the manual theme toggle. Post hero
images stay (intentional addition beyond the mockup).

## Out of scope

- Expanding post prose styles (lists, images, blockquotes, etc.)
- Removing or restyling post hero images
- Token value changes (colours already match light/dark mockup tokens)
- Layout restructure (reading column / padding already match mockup)
- A Tokens reference page (mockup QA aid only)

## Audit findings (1280×900, light mode)

Already matching: colour tokens, header/main/footer padding, 640px content
column, home post preview spacing, archive list layout, post chrome
(back link, h1, meta, prose p/h2, post-nav).

Mismatches / chrome diffs to fix:

| Location | Mockup | Live | Cause |
|----------|--------|------|-------|
| Archive `<time>` | 13px Zen Kaku, muted | 18px Source Serif, body colour | Astro scoped CSS: `li time` does not pierce child component |
| Home intro | `letter-spacing: 0.02em` | `normal` | Omitted from `index.astro` |
| Home post title h2 | `line-height: 1.35` | `1.3` | Global `h1–h6` rule wins |
| Theme toggle | Not in live chrome (demo bar only) | Button in main nav + `localStorage` override | Spec previously kept a manual toggle; now removed |

## Approach

Surgical CSS fixes in the two page files that own the mismatched rules, plus
removing the toggle from `Header` and simplifying theme init to OS preference
only. No new components, no shared token extraction.

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

### 3. `src/components/Header.astro`

Remove the `#theme-toggle` button, its CSS, and the click/`localStorage`
script. Nav returns to Home / Writing / JFM Digital Works only (mockup live
chrome).

### 4. `src/components/BaseHead.astro`

Theme init follows OS preference only — no `localStorage` read/write:

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

Dark/light CSS variables in `global.css` stay; they still apply when
`data-theme` is set. Existing `localStorage` theme keys are ignored (stale
values from prior visits must not override the OS).

## Verification

Re-run a Playwright style check (or equivalent) against:

- `/blog/` — first `li time`: font-size 13px, Zen Kaku family, muted colour
- `/` — `.intro p` letter-spacing ≈ 0.02em; `.post-preview h2` line-height 1.35
- `/` — no `#theme-toggle` in the DOM; nav has three links only
- Theme: with `prefers-color-scheme: dark` (Playwright
  `colorScheme: 'dark'` or `emulateMedia`), `data-theme` is `dark` and body
  uses dark tokens; with light preference, `data-theme` is `light`
- Confirm a previously stored `localStorage.theme` does not override OS

`npm run a11y` should still pass for both themes (script sets `dataset.theme`
directly for checks; that remains valid).

## Success criteria

- The three audited CSS mismatches are resolved
- Theme toggle is gone; theme tracks OS preference (including live changes)
- Heroes remain
- No other front-end behaviour changes

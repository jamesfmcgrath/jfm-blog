# Visual Audit Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Astro front end with the approved visual-audit spec: fix three CSS mismatches, remove the theme toggle (OS preference only), use fluid content width with 65ch reading text, and add a hamburger disclosure nav below 900px.

**Architecture:** Keep the existing per-page scoped CSS and shared `Header`/`BaseHead`/`global.css` pattern. Layout width changes are CSS-only on page/layout wrappers; theme behaviour lives in an inline `BaseHead` script; mobile nav is Header markup + CSS media queries + a small inline script (`aria-expanded`, Escape, resize reset). Verification uses Playwright against `astro preview`, matching `scripts/a11y-check.mjs`.

**Tech Stack:** Astro 6, scoped component CSS, Playwright (already a devDependency), Node `>=22.12.0` (`.nvmrc` `v22.22.2`).

## Global Constraints

- Spec source of truth: `docs/superpowers/specs/2026-07-31-visual-audit-alignment-design.md`
- Design tokens in `global.css` must not change hex values
- Post hero images stay
- Nav collapse breakpoint is exactly `900px`
- No overlay/drawer menu — inline disclosure only
- No `localStorage` theme override
- Content wrappers: no `max-width: 640px`; main/header/footer keep `8vw`/`10vw` horizontal padding
- Reading text (`.prose`, home `.excerpt`): `max-width: 65ch`
- Use `nvm use` / Node from `.nvmrc` before `npm run build` / `preview` / tests
- Do not deploy or set secrets

## File map

| File | Responsibility |
|------|----------------|
| `src/components/BaseHead.astro` | OS-only theme init + `change` listener |
| `src/components/Header.astro` | Site title, hamburger disclosure nav (no theme toggle) |
| `src/pages/index.astro` | Home intro/posts CSS (audit fixes + fluid width) |
| `src/pages/blog/index.astro` | Archive list CSS (`:global(time)` + fluid width) |
| `src/layouts/BlogPost.astro` | Post layout: drop 640px, `.prose` 65ch |
| `src/layouts/Page.astro` | Page layout: drop 640px, `.prose` 65ch |
| `tests/front-end-layout.test.mjs` | Playwright assertions for theme, width, nav, audit CSS |
| `scripts/a11y-check.mjs` | Unchanged behaviour (may still set `dataset.theme` for axe) |

---

### Task 1: OS theme only — remove theme toggle

**Files:**
- Modify: `src/components/BaseHead.astro` (theme `<script is:inline>` block)
- Modify: `src/components/Header.astro` (remove button, styles, script)
- Create: `tests/front-end-layout.test.mjs`
- Test: `tests/front-end-layout.test.mjs`

**Interfaces:**
- Consumes: existing `document.documentElement.dataset.theme` + `:root[data-theme="dark"]` tokens in `global.css`
- Produces: theme applied from `prefers-color-scheme` only; Header has no `#theme-toggle`

- [ ] **Step 1: Write the failing layout test (theme + no toggle)**

Create `tests/front-end-layout.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'astro';

async function withPreview(fn) {
	const server = await preview({ root: process.cwd() });
	const browser = await chromium.launch();
	// a11y-check.mjs assumes http://localhost:4321 — match that.
	const baseURL = 'http://localhost:4321';
	try {
		await fn({ browser, baseURL });
	} finally {
		await browser.close();
		await server.stop();
	}
}

test('home has no theme toggle and follows prefers-color-scheme', async () => {
	await withPreview(async ({ browser, baseURL }) => {
		const context = await browser.newContext({ colorScheme: 'dark' });
		const page = await context.newPage();
		await page.goto(`${baseURL}/`);
		assert.equal(await page.locator('#theme-toggle').count(), 0);
		assert.equal(
			await page.evaluate(() => document.documentElement.dataset.theme),
			'dark',
		);
		await context.close();

		const light = await browser.newContext({ colorScheme: 'light' });
		const lightPage = await light.newPage();
		await lightPage.goto(`${baseURL}/`);
		await lightPage.evaluate(() => localStorage.setItem('theme', 'dark'));
		await lightPage.reload();
		assert.equal(
			await lightPage.evaluate(() => document.documentElement.dataset.theme),
			'light',
			'stale localStorage.theme must not override OS preference',
		);
		await light.close();
	});
});
```

Ensure nothing else is bound to port 4321 when tests run (same assumption as `scripts/a11y-check.mjs`).
- [ ] **Step 2: Run the test — expect failure**

```bash
source ~/.nvm/nvm.sh && nvm use
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: FAIL — `#theme-toggle` still present and/or `localStorage` still wins.

- [ ] **Step 3: Update BaseHead theme script**

Replace the theme `<script is:inline>` in `src/components/BaseHead.astro` with:

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

- [ ] **Step 4: Strip theme toggle from Header**

In `src/components/Header.astro`:
- Delete the `<button id="theme-toggle" …>` element
- Delete `#theme-toggle` / `#theme-toggle:hover` CSS rules
- Delete the entire `<script is:inline>` block that wires the button
- Leave skip-link, site title, and three nav links

Resulting nav markup:

```html
<nav aria-label="Main">
	<a href="/">Home</a>
	<a href="/blog/">Writing</a>
	<a href="https://jfmdigitalworks.com">JFM Digital Works</a>
</nav>
```

- [ ] **Step 5: Rebuild and re-run the test — expect pass**

```bash
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BaseHead.astro src/components/Header.astro tests/front-end-layout.test.mjs
git commit -m "$(cat <<'EOF'
Remove theme toggle; follow OS color scheme only

EOF
)"
```

---

### Task 2: Fix audited CSS mismatches (archive date, intro, home h2)

**Files:**
- Modify: `src/pages/blog/index.astro` (date selector)
- Modify: `src/pages/index.astro` (intro letter-spacing, h2 line-height)
- Modify: `tests/front-end-layout.test.mjs` (add assertions)
- Test: `tests/front-end-layout.test.mjs`

**Interfaces:**
- Consumes: `FormattedDate` rendering a `<time>` inside archive `<li>`
- Produces: archive dates styled 13px Zen Kaku muted; home intro `0.02em` tracking; home post titles `line-height: 1.35`

- [ ] **Step 1: Add failing assertions to the layout test**

Append to `tests/front-end-layout.test.mjs`:

```js
test('archive dates and home typography match mockup tokens', async () => {
	await withPreview(async ({ browser, baseURL }) => {
		const page = await browser.newPage();
		await page.emulateMedia({ colorScheme: 'light' });

		await page.goto(`${baseURL}/blog/`);
		const timeStyles = await page.locator('.archive li time').first().evaluate((el) => {
			const cs = getComputedStyle(el);
			return {
				fontSize: cs.fontSize,
				color: cs.color,
				fontFamily: cs.fontFamily,
				whiteSpace: cs.whiteSpace,
			};
		});
		assert.equal(timeStyles.fontSize, '13px');
		assert.equal(timeStyles.color, 'rgb(91, 86, 77)'); // --muted light
		assert.match(timeStyles.fontFamily, /Zen Kaku/i);
		assert.equal(timeStyles.whiteSpace, 'nowrap');

		await page.goto(`${baseURL}/`);
		const introLetter = await page.locator('.intro p').evaluate((el) => getComputedStyle(el).letterSpacing);
		// 0.02em at 14px ≈ 0.28px
		assert.ok(
			introLetter === '0.02em' || Math.abs(parseFloat(introLetter) - 0.28) < 0.05,
			`expected ~0.02em letter-spacing, got ${introLetter}`,
		);
		const h2Lh = await page.locator('.post-preview h2').first().evaluate((el) => getComputedStyle(el).lineHeight);
		assert.equal(h2Lh, '29.7px'); // 22px * 1.35
		await page.close();
	});
});
```

- [ ] **Step 2: Run test — expect failure on archive date and/or letter-spacing / line-height**

```bash
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: FAIL on archive `fontSize`/`color` and/or intro/h2 assertions.

- [ ] **Step 3: Fix archive date selector**

In `src/pages/blog/index.astro`, replace:

```css
li time {
```

with:

```css
li :global(time) {
```

Keep the same property block (`font-family`, `font-size: 13px`, `color: var(--muted)`, `white-space: nowrap`).

- [ ] **Step 4: Fix home intro and post title**

In `src/pages/index.astro`:

On `.intro p`, add:

```css
letter-spacing: 0.02em;
```

On `.post-preview h2`, add:

```css
line-height: 1.35;
```

- [ ] **Step 5: Rebuild and re-run tests — expect pass**

```bash
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/blog/index.astro src/pages/index.astro tests/front-end-layout.test.mjs
git commit -m "$(cat <<'EOF'
Fix archive date scoping and home typography vs mockup

EOF
)"
```

---

### Task 3: Fluid content width with 65ch reading text

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/layouts/BlogPost.astro`
- Modify: `src/layouts/Page.astro`
- Modify: `tests/front-end-layout.test.mjs`
- Test: `tests/front-end-layout.test.mjs`

**Interfaces:**
- Consumes: existing `main { padding: 0 8vw 0 10vw; }` on each template
- Produces: no content wrapper at `max-width: 640px`; `.prose` and `.excerpt` at `max-width: 65ch`

- [ ] **Step 1: Add failing width assertions**

```js
test('content is fluid with 65ch reading measure', async () => {
	await withPreview(async ({ browser, baseURL }) => {
		const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
		await page.emulateMedia({ colorScheme: 'light' });

		await page.goto(`${baseURL}/`);
		const postsWidth = await page.locator('.posts').evaluate((el) => el.getBoundingClientRect().width);
		assert.ok(postsWidth > 700, `expected fluid .posts wider than 640px, got ${postsWidth}`);
		const excerptMax = await page.locator('.post-preview .excerpt').first().evaluate((el) => getComputedStyle(el).maxWidth);
		assert.equal(excerptMax, '65ch');

		await page.goto(`${baseURL}/blog/`);
		const archiveWidth = await page.locator('.archive').evaluate((el) => el.getBoundingClientRect().width);
		assert.ok(archiveWidth > 700, `expected fluid .archive, got ${archiveWidth}`);

		await page.goto(`${baseURL}/right-sizing-government-websites/`);
		const postWidth = await page.locator('.post').evaluate((el) => el.getBoundingClientRect().width);
		const proseMax = await page.locator('.prose').evaluate((el) => getComputedStyle(el).maxWidth);
		assert.ok(postWidth > 700, `expected fluid .post, got ${postWidth}`);
		assert.equal(proseMax, '65ch');

		await page.goto(`${baseURL}/learn-javascript-for-beginners/`);
		const pageWidth = await page.locator('.page').evaluate((el) => el.getBoundingClientRect().width);
		const pageProseMax = await page.locator('.prose').evaluate((el) => getComputedStyle(el).maxWidth);
		assert.ok(pageWidth > 700, `expected fluid .page, got ${pageWidth}`);
		assert.equal(pageProseMax, '65ch');

		await page.close();
	});
});
```

- [ ] **Step 2: Run test — expect failure (still 640px wrappers)**

```bash
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: FAIL on width `> 700` assertions.

- [ ] **Step 3: Apply CSS changes**

`src/pages/index.astro`:
- Remove `max-width: 640px` from `.intro` and `.posts`
- Change `.post-preview .excerpt` from `max-width: 62ch` to `max-width: 65ch`

`src/pages/blog/index.astro`:
- Remove `max-width: 640px` from `.archive` (keep vertical padding)

`src/layouts/BlogPost.astro`:
- Remove `max-width: 640px` from `.post`
- Add to `.prose`:

```css
max-width: 65ch;
```

`src/layouts/Page.astro`:
- Remove `max-width: 640px` from `.page`
- Add to `.prose`:

```css
max-width: 65ch;
```

Do **not** change header/main/footer horizontal padding values.

- [ ] **Step 4: Rebuild and re-run tests — expect pass**

```bash
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/pages/blog/index.astro src/layouts/BlogPost.astro src/layouts/Page.astro tests/front-end-layout.test.mjs
git commit -m "$(cat <<'EOF'
Use fluid content width with 65ch reading measure

EOF
)"
```

---

### Task 4: Hamburger disclosure nav below 900px

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `tests/front-end-layout.test.mjs`
- Test: `tests/front-end-layout.test.mjs`

**Interfaces:**
- Consumes: Header without theme toggle (Task 1)
- Produces: `.nav-toggle` + `#site-nav` disclosure; collapsed below 900px; open via `aria-expanded`; Escape closes; resize ≥900px resets closed

- [ ] **Step 1: Add failing nav assertions**

```js
test('nav collapses to hamburger below 900px', async () => {
	await withPreview(async ({ browser, baseURL }) => {
		const page = await browser.newPage({ viewport: { width: 880, height: 800 } });
		await page.goto(`${baseURL}/`);

		const toggle = page.locator('.nav-toggle');
		await assert.equal(await toggle.isVisible(), true);
		assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
		assert.equal(await toggle.getAttribute('aria-controls'), 'site-nav');

		// Nav links not visible while collapsed
		assert.equal(await page.locator('#site-nav a').first().isVisible(), false);

		await toggle.click();
		assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
		assert.equal(await page.locator('#site-nav a').first().isVisible(), true);
		assert.match(await toggle.innerText(), /close/i);

		await page.keyboard.press('Escape');
		assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
		assert.equal(await page.locator('#site-nav a').first().isVisible(), false);

		await page.setViewportSize({ width: 1000, height: 800 });
		assert.equal(await toggle.isVisible(), false);
		assert.equal(await page.locator('#site-nav a').first().isVisible(), true);

		await page.close();
	});
});
```

- [ ] **Step 2: Run test — expect failure (no `.nav-toggle`)**

```bash
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: FAIL — `.nav-toggle` missing.

- [ ] **Step 3: Implement Header markup, CSS, and script**

Replace `src/components/Header.astro` content with:

```astro
---
import { SITE_TITLE } from '../consts';
---
<a href="#main" class="skip-link">Skip to content</a>
<header>
	<a href="/" class="site-title">{SITE_TITLE}</a>
	<button
		type="button"
		class="nav-toggle"
		aria-expanded="false"
		aria-controls="site-nav"
	>
		Menu
	</button>
	<nav id="site-nav" aria-label="Main">
		<a href="/">Home</a>
		<a href="/blog/">Writing</a>
		<a href="https://jfmdigitalworks.com">JFM Digital Works</a>
	</nav>
</header>
<style>
	header {
		padding: 56px 8vw 40px 10vw;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 20px;
		border-bottom: 1px solid var(--border);
	}
	.site-title {
		font-family: var(--font-zen-kaku);
		font-size: 22px;
		font-weight: 500;
	}
	.nav-toggle {
		display: none;
		background: none;
		border: 1px solid var(--border);
		font-family: var(--font-zen-kaku);
		color: var(--text);
		cursor: pointer;
		padding: 6px 12px;
		border-radius: 2px;
		font-size: 12px;
	}
	.nav-toggle:hover {
		border-color: var(--accent);
	}
	nav {
		display: flex;
		gap: 28px;
		align-items: center;
		font-family: var(--font-zen-kaku);
		font-size: 15px;
	}
	@media (max-width: 899px) {
		.nav-toggle {
			display: inline-block;
			margin-left: auto;
		}
		nav {
			display: none;
			flex-basis: 100%;
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
			padding-top: 8px;
		}
		header:has(.nav-toggle[aria-expanded='true']) nav {
			display: flex;
		}
	}
</style>
<script is:inline>
	(function () {
		var button = document.querySelector('.nav-toggle');
		var nav = document.getElementById('site-nav');
		if (!button || !nav) return;

		function setOpen(open) {
			button.setAttribute('aria-expanded', open ? 'true' : 'false');
			button.textContent = open ? 'Close' : 'Menu';
		}

		button.addEventListener('click', function () {
			setOpen(button.getAttribute('aria-expanded') !== 'true');
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
				setOpen(false);
				button.focus();
			}
		});

		window.addEventListener('resize', function () {
			if (window.matchMedia('(min-width: 900px)').matches) {
				setOpen(false);
			}
		});
	})();
</script>
```

Notes:
- Breakpoint uses `max-width: 899px` so “below 900px” matches the spec.
- `:has(.nav-toggle[aria-expanded='true'])` shows the nav without a second JS class; supported in current evergreen browsers targeted by this static site.
- If axe or a target browser rejects `:has`, fall back to toggling a class on `header` in the same `setOpen` function (`header.classList.toggle('nav-open', open)`) and style `header.nav-open nav { display: flex; }` instead — prefer the class fallback if any a11y run complains about visibility.

- [ ] **Step 4: Rebuild and re-run tests — expect pass**

```bash
npm run build
node --experimental-strip-types --test tests/front-end-layout.test.mjs
```

Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.astro tests/front-end-layout.test.mjs
git commit -m "$(cat <<'EOF'
Add hamburger disclosure nav below 900px

EOF
)"
```

---

### Task 5: Accessibility and full suite verification

**Files:**
- Test only: existing `scripts/a11y-check.mjs`, `tests/*.test.mjs`
- Modify: none unless a11y fails (then fix the violating component and note in commit)

**Interfaces:**
- Consumes: all prior tasks’ DOM
- Produces: green `npm test` and `npm run a11y`

- [ ] **Step 1: Run unit/layout tests**

```bash
source ~/.nvm/nvm.sh && nvm use
npm test
```

Expected: all tests PASS, including `tests/front-end-layout.test.mjs`.

- [ ] **Step 2: Run axe check**

```bash
npm run build
npm run a11y
```

Expected: `All pages pass with zero violations in both themes.`

If the hamburger button or collapsed nav causes a violation (e.g. `button-name`, `aria-allowed-attr`, focus order), fix in `Header.astro` minimally and re-run until clean — then commit that fix:

```bash
git add src/components/Header.astro
git commit -m "$(cat <<'EOF'
Fix hamburger nav accessibility findings

EOF
)"
```

- [ ] **Step 3: Manual smoke (optional but recommended)**

```bash
npm run preview -- --port 4321
```

Check `/`, `/blog/`, one post at ~880px and ~1280px widths: fluid column, 65ch prose, Menu/Close, no theme toggle, OS dark mode if system is dark.

- [ ] **Step 4: Final commit only if Step 2 required fixes; otherwise done**

No empty commit.

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Archive `:global(time)` styling | Task 2 |
| Intro `letter-spacing: 0.02em` | Task 2 |
| Home h2 `line-height: 1.35` | Task 2 |
| Remove theme toggle | Task 1 |
| OS preference + `change` listener; ignore `localStorage` | Task 1 |
| Drop 640px wrappers (home, archive, post, page) | Task 3 |
| Keep 8vw/10vw padding | Task 3 (explicit non-change) |
| `65ch` on `.prose` / excerpts | Task 3 |
| Hamburger <900px, disclosure, Escape, resize reset | Task 4 |
| Keep heroes | No task removes them |
| a11y verification | Task 5 |

## Placeholder / consistency check

- No TBD/TODO steps
- Breakpoint consistently `899px` max / `900px` min across CSS and JS
- Toggle class name `.nav-toggle`, nav id `site-nav` used in markup, CSS, JS, and tests
- Button labels `Menu` / `Close` match test `/close/i` assertion

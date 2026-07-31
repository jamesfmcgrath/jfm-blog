# GoatCounter Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cookieless GoatCounter pageview tracking to the Astro site, gated on `PUBLIC_GOATCOUNTER_CODE`, with production builds wired in GitHub Actions.

**Architecture:** A tiny pure helper builds the GoatCounter count URL from a site code (or returns null when unset). `BaseHead.astro` emits the official snippet only when that helper returns a URL. Deploy workflow passes the code as a public env var at build time.

**Tech Stack:** Astro 6, `import.meta.env.PUBLIC_*`, GoatCounter hosted `count.js`, Node test runner, GitHub Actions `vars`.

## Global Constraints

- Cookieless; no consent banner or custom events in v1.
- Script omitted when `PUBLIC_GOATCOUNTER_CODE` is unset/empty (dev/CI without the var stay clean).
- No Hostinger server changes; analytics traffic goes to GoatCounter.
- Site code is public (appears in HTML); use GitHub Actions **variable** `PUBLIC_GOATCOUNTER_CODE`, not a secret.
- Official snippet shape: `data-goatcounter="https://{code}.goatcounter.com/count"` + `src="https://gc.zgo.at/count.js"` async.

## File structure

| File | Responsibility |
|------|----------------|
| `src/lib/goatcounter.ts` | Pure helper: code → count URL or `null` |
| `tests/goatcounter.test.mjs` | Unit tests for the helper |
| `src/components/BaseHead.astro` | Emit snippet when helper returns a URL |
| `.github/workflows/deploy.yml` | Pass `PUBLIC_GOATCOUNTER_CODE` into `npm run build` |
| `.env.example` | Document the env var for local/prod |

---

### Task 1: GoatCounter URL helper

**Files:**
- Create: `src/lib/goatcounter.ts`
- Create: `tests/goatcounter.test.mjs`

**Interfaces:**
- Produces: `goatcounterCountUrl(code: string | undefined): string | null`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goatcounterCountUrl } from '../src/lib/goatcounter.ts';

test('returns null when code is unset or blank', () => {
	assert.equal(goatcounterCountUrl(undefined), null);
	assert.equal(goatcounterCountUrl(''), null);
	assert.equal(goatcounterCountUrl('   '), null);
});

test('returns count URL for a valid site code', () => {
	assert.equal(
		goatcounterCountUrl('jamesfmcgrath'),
		'https://jamesfmcgrath.goatcounter.com/count',
	);
});

test('trims whitespace around the code', () => {
	assert.equal(
		goatcounterCountUrl('  jamesfmcgrath  '),
		'https://jamesfmcgrath.goatcounter.com/count',
	);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/goatcounter.test.mjs`  
Expected: FAIL (module not found / export missing)

- [ ] **Step 3: Write minimal implementation**

```ts
export function goatcounterCountUrl(code: string | undefined): string | null {
	if (code == null) return null;
	const trimmed = code.trim();
	if (!trimmed) return null;
	return `https://${trimmed}.goatcounter.com/count`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/goatcounter.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/goatcounter.ts tests/goatcounter.test.mjs
git commit -m "Add GoatCounter count URL helper"
```

---

### Task 2: Emit snippet from BaseHead

**Files:**
- Modify: `src/components/BaseHead.astro`
- Create: `.env.example`

**Interfaces:**
- Consumes: `goatcounterCountUrl(import.meta.env.PUBLIC_GOATCOUNTER_CODE)`
- Produces: optional `<script data-goatcounter="..." async src="https://gc.zgo.at/count.js">` in every page head

- [ ] **Step 1: Wire BaseHead**

At top of frontmatter, import and resolve:

```astro
import { goatcounterCountUrl } from '../lib/goatcounter';

const goatcounterUrl = goatcounterCountUrl(import.meta.env.PUBLIC_GOATCOUNTER_CODE);
```

At end of template (after existing meta/theme script):

```astro
{goatcounterUrl && (
	<script
		is:inline
		data-goatcounter={goatcounterUrl}
		async
		src="https://gc.zgo.at/count.js"
	></script>
)}
```

Use `is:inline` so Astro does not bundle/transform the third-party loader (attributes must survive on the emitted tag).

- [ ] **Step 2: Add `.env.example`**

```
# GoatCounter site code (subdomain). Leave unset to disable analytics.
# PUBLIC_GOATCOUNTER_CODE=yourcode
```

- [ ] **Step 3: Smoke-check build without env**

Run: `npm run build` then `rg -l 'goatcounter|gc\.zgo\.at' dist/`  
Expected: no matches (or empty)

- [ ] **Step 4: Smoke-check build with env**

Run: `PUBLIC_GOATCOUNTER_CODE=testdomain npm run build` then confirm `dist/index.html` contains `data-goatcounter="https://testdomain.goatcounter.com/count"` and `gc.zgo.at/count.js`

- [ ] **Step 5: Commit**

```bash
git add src/components/BaseHead.astro .env.example
git commit -m "Emit GoatCounter script when PUBLIC_GOATCOUNTER_CODE is set"
```

---

### Task 3: Deploy workflow env var

**Files:**
- Modify: `.github/workflows/deploy.yml` (Build step)

**Interfaces:**
- Consumes: GitHub Actions repository variable `PUBLIC_GOATCOUNTER_CODE`
- Produces: production `dist/` with snippet when the variable is set

- [ ] **Step 1: Pass env into Build step**

Replace the Build step with:

```yaml
      - name: Build
        env:
          PUBLIC_GOATCOUNTER_CODE: ${{ vars.PUBLIC_GOATCOUNTER_CODE }}
        run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Pass GoatCounter code into production Astro builds"
```

- [ ] **Step 3: Note for human (not automated)**

After merge, set repo variable `PUBLIC_GOATCOUNTER_CODE` to the GoatCounter site code (hPanel/GitHub Settings → Variables). Confirm before first production deploy that uses it. Do not set via agent unless the user explicitly asks.

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| GoatCounter hosted, cookieless snippet | Task 2 |
| Gated on env so unset = no script | Tasks 1–2 |
| Deploy unchanged except build env | Task 3 |
| No custom events / no history migration / no consent UI | Out of scope (no tasks) |
| Test absent vs present script | Task 1 unit + Task 2 smoke builds |

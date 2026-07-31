# Default OG + Home Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use `james-and-a-monkey.png` as the OG fallback for pages without an image, and as a full-bleed home hero.

**Architecture:** Canonical asset in `src/assets/`. `BaseHead` always resolves an image URL (prop or default via `getImage`). Home page renders the same asset with Astro `<Image>` full-bleed under the header.

**Tech Stack:** Astro 6 assets (`Image`, `getImage`), existing `BaseHead` meta tags.

## Global Constraints

- Fallback only — do not override post featured OG images.
- Full-bleed hero under header on home only.
- Suggested alt: `James with a monkey`.

---

### Task 1: Asset + BaseHead default OG

**Files:**
- Move: `src/content/blog/images/james-and-a-monkey.png` → `src/assets/james-and-a-monkey.png`
- Modify: `src/components/BaseHead.astro`
- Create: `tests/default-og.test.mjs` (build smoke via reading dist after build in verify step, or assert helper)

- [ ] **Step 1:** Ensure asset lives at `src/assets/james-and-a-monkey.png`
- [ ] **Step 2:** In `BaseHead.astro`, `getImage` the default at width 1200 JPEG; set `imageURL` from prop or default
- [ ] **Step 3:** Always emit og/twitter image tags (default fills the gap)
- [ ] **Step 4:** Commit

### Task 2: Home full-bleed hero

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `tests/front-end-layout.test.mjs` (assert hero present)

- [ ] **Step 1:** Import `Image` + asset; render hero under `Header`, before intro
- [ ] **Step 2:** CSS full-bleed (100vw / break out of main padding)
- [ ] **Step 3:** Test home has `.home-hero img` (or role)
- [ ] **Step 4:** Build; verify home + blog HTML have og:image; a post with frontmatter image differs
- [ ] **Step 5:** Commit

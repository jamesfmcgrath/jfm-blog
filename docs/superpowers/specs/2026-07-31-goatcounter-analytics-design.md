# GoatCounter analytics for jamesfmcgrath.org

Date: 2026-07-31
Status: Approved design; awaiting implementation plan.

## Purpose

Replace Google Analytics (and the WordPress-era WP Analytics / `wpa-stats`
setup) with a privacy-friendly, cookieless analytics option for the Astro
static site. No cookie consent banner. Hostinger stays static-only; analytics
are handled by a hosted SaaS.

## Decision

**GoatCounter** (hosted free tier for personal use).

Chosen over Plausible (paid, richer UI) and Cloudflare Web Analytics (best
when DNS is already on Cloudflare) because:

- Matches the need: page views, top pages, referrers, countries
- Cookieless / GDPR-friendly without a consent popup for typical personal-blog use
- Free for non-commercial / personal sites
- One script tag; no server process on Hostinger

## Integration

### Site code

Create a GoatCounter site for `jamesfmcgrath.org` outside the repo (one-time
account setup). The resulting site code is configured via an environment
variable, e.g. `PUBLIC_GOATCOUNTER_CODE`, so it can be set in GitHub Actions
for production builds without baking secrets into the repo. The code is not
secret in the GA sense (it appears in the page HTML), but keeping it env-driven
avoids tracking noise from local/dev and makes the site build cleanly when unset.

### Script injection

Add the official GoatCounter script in `src/components/BaseHead.astro` so every
page that uses the shared head picks it up.

Behaviour:

- If `PUBLIC_GOATCOUNTER_CODE` (or equivalent) is unset/empty: emit nothing.
- If set: emit GoatCounter’s standard async snippet pointing at that site
  (e.g. `https://{code}.goatcounter.com/count.js` / data-goatcounter attribute
  per current GoatCounter docs at implementation time).

Local `astro dev` and CI builds without the env var therefore send no hits.

### Deploy

No change to the Hostinger rsync deploy path. Analytics requests go to
GoatCounter’s servers from the visitor’s browser. Production builds (GitHub
Actions) set `PUBLIC_GOATCOUNTER_CODE` as a repo variable/secret so the live
`dist/` includes the snippet.

## Out of scope

- Migrating historical WP Analytics / Google Analytics data
- Self-hosting GoatCounter
- Custom events (outbound clicks, RSS hits, etc.)
- New privacy-policy page or rewrite (site has no dedicated policy page today;
  revisit only if legal/hosting needs change)
- Cookie / consent UI of any kind

## Testing

1. Build without the env var: confirm page HTML has no GoatCounter script.
2. Build with a test code set: confirm script and `data-goatcounter` (or
   current equivalent) are present in `BaseHead` output.
3. After production cutover: open the GoatCounter dashboard and confirm
   pageviews appear for a few known paths (`/`, `/blog/`, one post slug).

## Success criteria

- Live site reports pageviews, top pages, referrers, and countries in
  GoatCounter without a cookie banner.
- Dev/preview without the env var remains untracked.
- Deploy workflow and Hostinger hosting pattern stay unchanged aside from
  setting the build env var.

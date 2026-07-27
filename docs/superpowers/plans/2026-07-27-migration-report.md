# Migration report — 2026-07-27

## Summary

- Source: `jamesmcgrath.WordPress.2026-07-27.xml` (real export, 222 items), filtered
  by `scripts/migrate-wordpress/filter-export.mjs` to 82 items (33 `post`, 48
  `attachment`, 1 `page` — post ID 1039).
- Conversion tool: `wordpress-export-to-markdown@3.0.6`.
- Result: 33 posts in `src/content/blog/*.md`, 1 page in
  `src/content/pages/learn-javascript-for-beginners.md`, 44 images downloaded
  successfully from the live site (43 in `src/content/blog/images/`, 1 in
  `src/content/pages/images/`).
- Fixture posts (`fixture-one.md`, `fixture-two.md`) removed.
- Build: `npm run build` exits 0, 35 pages generated, no image-resolution
  warnings.

## Step 2: conversion tool console output (verbatim)

```
Skipping wizard...

Parsing...
33 normal posts found.
1 pages found.
48 attached images found.
3 images scraped from post body content.

Saving posts...
34 posts to save.
✓ [post] right-sizing-government-websites
... (33 posts total, all ✓)
✓ [page] learn-javascript-for-beginners
Done, got them all!

Saving images...
44 images to save.
✓ [image] DALL·E-2025-02-18-09.39.52-... (44 images total, all ✓)
Done, got them all!

All done!
```

Post/page counts match the brief's expectation exactly (33 posts, 1 page).
Network access to download images from the live `jamesfmcgrath.org` was
available in this environment — all 44 images downloaded without error, no
`--save-images=none` fallback was needed.

## Deviation from the brief: output folder structure

The brief's Step 2 "Expected" text says files land flat in
`src/content/blog/*.md` and `src/content/blog/images/*`. In practice,
`wordpress-export-to-markdown@3.0.6` unconditionally nests output by WordPress
post type (confirmed by reading `src/shared.js` in the installed package: a
`posts` / `pages` / `custom/<type>` path segment is always inserted based on
`post.type`, regardless of the `--post-folders` flag — that flag only
controls whether an *individual* post gets its own subdirectory with
`index.md`, not whether the type-level folder exists). The tool therefore
wrote to:

- `src/content/blog/posts/*.md` (33 files) + `src/content/blog/posts/images/*` (43 files)
- `src/content/blog/pages/learn-javascript-for-beginners.md` + `src/content/blog/pages/images/learn-javascript-for-beginners.png`

Because the `blog` collection's loader in `src/content.config.ts` globs
recursively (`pattern: '**/*.{md,mdx}'`), this nested structure would have
worked functionally as-is. To match the brief's stated deliverable (flat
`src/content/blog/*.md` and `src/content/blog/images/*`) and keep the
directory layout simple and predictable, the `posts/` and `pages/`
subdirectories were flattened by hand after the tool ran:

```bash
mkdir -p src/content/blog/images
mv src/content/blog/posts/*.md src/content/blog/
mv src/content/blog/posts/images/* src/content/blog/images/
rmdir src/content/blog/posts/images src/content/blog/posts
```

This is a mechanical move only — no file content was altered by this step,
and relative `images/<filename>` references inside post bodies remained
correct because the images moved the same distance relative to their posts.

## Step 3: moving the migrated page

The tool saved the one `page` item as
`src/content/blog/pages/learn-javascript-for-beginners.md` (already separated
from posts by the tool itself, one level further nested than the brief
assumed — see deviation note above). Moved to
`src/content/pages/learn-javascript-for-beginners.md`, and its image
(`learn-javascript-for-beginners.png`) to
`src/content/pages/images/learn-javascript-for-beginners.png`.

The generated frontmatter was:

```yaml
---
title: "🧠 Learn JavaScript One Day at a Time"
date: 2025-07-29
slug: "learn-javascript-for-beginners"
---
```

`slug` was dropped per the brief (the `pages` schema only has `title` and
optional `date`); the brief's frontmatter example omitted `excerpt` too, but
the tool did not actually add an `excerpt` field to this item's frontmatter
in the first place, so there was nothing further to remove there. Final
frontmatter:

```yaml
---
title: "🧠 Learn JavaScript One Day at a Time"
date: 2025-07-29
---
```

Actual date used: 2025-07-29 (from the tool's output), not the `2026-XX-XX`
placeholder in the brief.

Note: `learn-javascript-for-beginners.png` is not referenced anywhere in the
page body (no `![...]` markup in the markdown) — it was the post's WordPress
featured/thumbnail image, carried over by the tool but currently unused by
any template. Not a defect, just worth flagging as an orphaned asset until a
future task wires up page templates/routing (see routing note below).

## Step 4: shortcode / embed / raw-HTML review

Command run: `grep -lE '\[[a-z_-]+[^]]*\]|<script|<iframe' src/content/blog/*.md`

Result — 5 files flagged:

- `src/content/blog/choosing-the-right-tech.md`
- `src/content/blog/drupal-ai-initiative-opportunity.md`
- `src/content/blog/handling-the-small-things-to-conquer-the-big-events.md`
- `src/content/blog/localgov-drupal-week-recap-hope.md`
- `src/content/blog/right-sizing-government-websites.md`

Each of these five files was opened and read in full. Judgment on each:

- **`choosing-the-right-tech.md`** — false positive. The only bracket match
  is a normal Markdown link, `**[jamesfmcgrath.org](https://jamesfmcgrath.org/blog/)**`.
  No shortcode, no embed, no raw HTML. No action needed.
- **`drupal-ai-initiative-opportunity.md`** — false positive. Matches are all
  ordinary Markdown links (`[Dries Buytaert](...)`, `[Drupal AI Initiative](...)`,
  `[the challenges facing...](...)`). No action needed.
- **`handling-the-small-things-to-conquer-the-big-events.md`** — false
  positive. One line of ordinary Markdown links to `[blog]`, `[Bluesky]`,
  `[LinkedIn]`. No action needed.
- **`localgov-drupal-week-recap-hope.md`** — false positive, but worth
  calling out because this file is the only migrated post with genuine
  inline images. The flagged lines are linked-image Markdown,
  `[![Agile Collective](images/agile-coop_2-1024x683.png)](https://agile.coop/)`
  etc. — a standard `[![alt](src)](href)` construct (image wrapped in a
  link), correctly converted by the tool. No WordPress shortcode or embed
  present. No action needed.
- **`right-sizing-government-websites.md`** — false positive. All matches are
  ordinary Markdown links, including two bare-URL links formatted as
  `[https://...](https://...)`. No action needed.

**Conclusion:** none of the 5 flagged files contain genuine WordPress
shortcodes, `<script>`/`<iframe>` embeds, or un-converted raw HTML needing
manual cleanup. Every match is the grep pattern's bracket clause
(`\[[a-z_-]+[^]]*\]`) catching ordinary Markdown link syntax `[text](url)`,
since lowercase link text satisfies the character class. A broader sweep for
common WordPress shortcode names (`gallery`, `caption`, `embed`, `youtube`,
`vimeo`, `audio`, `video`, `wp_caption`) across all 33 posts also found
nothing, and no post anywhere contains `<script` or `<iframe`. No files were
modified as a result of this review.

## Step 5: image handling spot-check

```
$ ls src/content/blog/images | head -5
750D53D5-29AE-4001-A91E-B16A7A78E34F_1_102_o.jpeg
agile-coop_2-1024x683.png
agile-coop_2.png
annertech-1024x683.jpg
annertech.jpg
```

Only one migrated post contains inline image references:
`localgov-drupal-week-recap-hope.md`, e.g.:

```markdown
[![Agile Collective](images/agile-coop_2-1024x683.png)](https://agile.coop/)
```

— a relative `images/<filename>` path, resolved by Astro's Markdown image
pipeline since the images live alongside the post in
`src/content/blog/images/`.

`npm run build` output confirmed all three images in that post were resolved
and optimized to `.webp` with no warnings:

```
 generating optimized images 
  ▶ /_astro/agile-coop_2-1024x683.DFqz86ZJ_1hOCQ4.webp (before: 21kB, after: 10kB) (+554ms) (1/3)
  ▶ /_astro/annertech-1024x683.Keyiz_W2_Z1QWsEN.webp (before: 23kB, after: 9kB) (+557ms) (2/3)
  ▶ /_astro/BBD-Logo-coloured-background-1024x683.D870tZIH_ZbORhq.webp (before: 173kB, after: 50kB) (+571ms) (3/3)
```

No image-resolution warning was logged by Astro. Nothing to report here.

## Step 7: build and post count

```
$ npm run build
...
21:59:53 [build] 35 page(s) built in 1.58s
21:59:53 [build] Complete!
BUILD EXIT: 0

$ find dist -maxdepth 1 -type d | wc -l
36
```

36 = `dist` itself + `_astro` + `blog` + 33 post slug directories. Spot-checked:

```
test -d dist/right-sizing-government-websites   # OK
test -d dist/localgov-drupal-week-recap-hope    # OK
test -d dist/what-is-a-boolean                  # OK
```

**Note on `learn-javascript-for-beginners` and dist:** the brief's Step 7
"Expected" text says dist should contain "`blog`, `learn-javascript-for-beginners`,
etc." alongside the 33 post slugs. It does not — `dist/learn-javascript-for-beginners`
was not generated. This is expected and not a bug in this task's work:
`src/pages/[...slug].astro` only calls `getStaticPaths()` over
`getCollection('blog')`; there is currently no route in the Astro app that
renders the `pages` collection at all. This is confirmed as an intentional
gap by the plan's own progress ledger (`docs/superpowers/plans/... progress.md`,
Task 4 entry): "`src/content/pages` empty dir produces harmless glob-loader
warning until Task 7/8 populate it" — i.e., populating the collection is
Task 7's job (done here), wiring up a route/template for it is left to a
later task (8+). No code change was made to add page routing, consistent
with the brief's Interfaces section stating "no code changes needed here —
only content changes."

## Step 8: commit

Fixtures removed:

```
rm src/content/blog/fixture-one.md src/content/blog/fixture-two.md
```

Committed content changes (see commit hash in the task report).

---

## Fix round 1 (post-review): content-quality defects the Step 4 grep missed

Review found three classes of real defects that
`grep -lE '\[[a-z_-]+[^]]*\]|<script|<iframe'` cannot catch, because none of
them involve brackets, `<script>`, or `<iframe>`. All three are fixed below.

### 1. Corrupted code blocks (9 posts)

`wordpress-export-to-markdown@3.0.6` does not convert `<br>`/`<br/>`/`<br />`
tags inside `<pre><code>` (WordPress "Preformatted" blocks) into newlines —
it strips them, squishing multi-statement JS examples onto one unreadable
line. For each affected post, I located the matching `<item>` in the raw
`jamesmcgrath.WordPress.2026-07-27.xml` by `wp:post_name`, read the actual
`<pre class="wp-block-preformatted"><code>...</code></pre>` block in
`content:encoded`, and reconstructed real line breaks at each `<br>`,
decoding any `&lt;`/`&gt;`/`&amp;` entities back to literal characters. Fixed
files (all `src/content/blog/`), with every corrupted block in each file (in
some cases more than the two lines originally reported):

- `ctrl-alt-learn-day-2-functions.md` — two blocks (`sayHello`, `aboutMe`)
- `ctrl-alt-learn-day-3-arrays.md` — one block (`favorites` array + log)
- `what-is-a-boolean.md` — three blocks (`isSunny`/`hasUmbrella`,
  `likesPizza`/`hasCat`, the `if (likesPizza)` block)
- `what-is-a-function-parameter.md` — two blocks (`greet`, `sayFavorite`,
  each restoring the blank line before the trailing call)
- `what-is-a-loop.md` — two blocks (both `for` loops; entities `&lt;` were
  already correctly decoded to `<` by the tool outside the `<br>` issue, so
  only the missing newline needed fixing)
- `what-is-a-return-statement.md` — two blocks (`add`, `getEmoji`, each
  restoring the blank line before the trailing call)
- `what-is-an-if-statement.md` — two blocks (`isRaining`, `favoriteColor`,
  each restoring the blank line between the variable and the `if`)
- `what-is-an-object.md` — two blocks (`person` object, `me` object + log)
- `what-is-console-log.md` — two blocks (`name`/log, three `console.log`
  calls)

Verified via source diff against the original `content:encoded` for each of
the 9 files — every reconstructed block now matches the `<br>`-delimited
source line-for-line. A follow-up sweep,
`grep -nE '\}[a-zA-Z]|;[a-zA-Z]' src/content/blog/*.md` (excluding URLs),
found zero remaining squished lines across all 33 posts, confirming these 9
were the complete set.

### 2. Hotlinked WordPress media-library URL (`ctrl-alt-learn-day-2-functions.md`)

The link text "Ctrl + Alt + Learn – Day 1: What Is a Variable?" pointed at
`https://jamesfmcgrath.org/wp-content/uploads/2025/07/ChatGPT-Image-Jul-17-2025-08_29_50-AM.png`
— an image URL on the old media library, not the intended post. Checked:
`ctrl-alt-learn-day-1-variable.md` **does exist** among the 33 migrated
posts (slug `ctrl-alt-learn-day-1-variable`, confirmed via
`ls src/content/blog | grep -i day-1` and its frontmatter). Relinked to the
local route `/ctrl-alt-learn-day-1-variable/` instead of downloading the
hotlinked image — the author's original intent (link to the Day 1 post) is
fully resolvable in this case, so no fallback image-download was needed.

### 3. Undecoded HTML entities in frontmatter titles

`wordpress-export-to-markdown`'s `title()` getter does not decode HTML
entities. Fixed the two confirmed cases:

- `making-the-most-of-rss.md`: `"Making the Most of RSS: Feeds to Follow
  &amp; Creative Uses"` → `"Making the Most of RSS: Feeds to Follow &
  Creative Uses"`
- `why-i-love-drupal-microsites.md`: `"Why I Love Drupal &amp; Microsites"`
  → `"Why I Love Drupal & Microsites"`

Confirmed against the raw export (`<title><![CDATA[...&amp;...]]></title>`)
that the source title genuinely contains a literal `&`, XML-escaped by
WordPress's exporter even inside CDATA — not a stray entity to strip.

Full sweep of all 33 posts' + 1 page's frontmatter `title` and `excerpt`
fields for any other undecoded entity (named or numeric — `&amp;`, `&lt;`,
`&gt;`, `&quot;`, `&nbsp;`, `&#8217;`, `&#8220;`/`&#8221;`,
`&#8211;`/`&#8212;`, etc., via `grep -nE '&[#a-zA-Z0-9]+;'` against each
file's frontmatter block) found no other occurrences. These two were the
complete set.

Note: after fixing the frontmatter to a literal `&`, the built HTML/RSS
output correctly single-escapes it back to `&amp;` in the markup (e.g.
`<title>Making the Most of RSS: Feeds to Follow &amp; Creative Uses</title>`
in `dist/making-the-most-of-rss/index.html` and in `dist/rss.xml`) — that is
correct XML/HTML serialization and renders as a single `&` character in a
browser or feed reader. The bug being fixed was the frontmatter *source*
containing the 5-character entity string, which without this fix would have
been double-escaped by Astro's templating into visibly broken `&amp;amp;`
in some contexts. Verified no `&amp;amp;` appears anywhere in the rebuilt
`dist/`.

### Verification

`npm run build` after all fixes: exit 0, 35 pages generated (same as
before — these were content-only fixes, no new/removed routes). Spot-checks
against `dist/`:

- `dist/ctrl-alt-learn-day-2-functions/index.html` — both code blocks now
  render as separate `<span class="line">` entries (real line breaks); the
  Day 1 link resolves to `href="/ctrl-alt-learn-day-1-variable/"` (also
  matches the auto-generated prev/next post-nav link to the same post).
- `dist/what-is-a-boolean/index.html` — code blocks render as separate
  lines.
- `dist/making-the-most-of-rss/index.html` and
  `dist/why-i-love-drupal-microsites/index.html` — `<title>` and `<h1>`
  both contain `&amp;` in the HTML source (correct single-encoding of a
  literal `&`); `dist/rss.xml` likewise.

No image-resolution warnings, no other build warnings.

Commit: see task report for the fix-round commit hash.

---

## Fix round 2 (post-review): 10th file with the same root-cause bug

A follow-up re-review found a 10th file affected by the same root cause as
fix round 1 (the converter's mishandling of `<br>` inside WordPress
"Preformatted" blocks), but shaped differently:

### `ctrl-alt-learn-day-1-variable.md`

In the raw export, this post's second code example is itself malformed
HTML — the code text sits **outside** the `<code>` tag entirely, with a
stray trailing `<code><br></code>`:

```html
<pre class="wp-block-preformatted">let myName = "Jamie";<br>let favoriteNumber = 42;<br>let favoriteThing = "ramen";<code><br></code></pre>
```

Because there was no `<pre><code>` pairing for the converter to treat as a
fenced code block, it fell back to treating this as a plain paragraph
instead of squishing it onto one line (round 1's failure mode). The result
was readable but wrong: a plain-text paragraph with hard line breaks
(`  ` + newline, i.e. Markdown's two-space break) instead of a code block,
plus a visible artifact from the stray `<code><br></code>` — an inline-code
chip containing just whitespace, rendered as `` `   ` `` trailing the last
statement.

Fixed by replacing the three-line plain paragraph with a proper fenced code
block, matching the plain ` ``` ` fence style (no language tag) used
everywhere else in this same file and in all 9 files fixed in round 1 —
consistency with the established convention took precedence over the
literal ` ```js ` suggestion in the review note, since the actual goal
("match how the other files' examples look") is a plain fence:

```
let myName = "Jamie";
let favoriteNumber = 42;
let favoriteThing = "ramen";
```

The stray empty inline-code artifact was removed entirely.

### Broader sweep for an 11th file

Wrote a one-off script (using the project's existing `xml2js` dependency,
not committed) that regex-matches every `<pre[^>]*>...</pre>` block across
all 33 posts' raw `content:encoded` and flags any block containing a `<br>`
tag anywhere inside it — not just inside `<pre><code>`, to catch malformed
variants like this one. Result: **exactly 19 matching blocks across exactly
10 files** — the same 9 files and 18 blocks fixed in round 1, plus this one
block in `ctrl-alt-learn-day-1-variable`. No 11th file exists; the sweep is
now exhaustive and confirms all `<br>`-in-`<pre>` defects (in any shape) are
fixed.

### Verification

```
$ npm run build
...
[build] 35 page(s) built in 896ms
[build] Complete!
BUILD EXIT: 0
```

```
$ grep -B1 -A5 "let myName" dist/ctrl-alt-learn-day-1-variable/index.html
<p><strong>Challenge:</strong> Write three variables: your name, your favourite number, and something you love.</p>
<pre class="astro-code github-dark" ...><code><span class="line"><span>let myName = "Jamie";</span></span>
<span class="line"><span>let favoriteNumber = 42;</span></span>
<span class="line"><span>let favoriteThing = "ramen";</span></span></code></pre>
```

Proper multi-line code block, no stray empty `<code>` tag anywhere in the
rebuilt file (`grep -c '<code>   </code>\|<code></code>'` → 0). No new build
warnings.

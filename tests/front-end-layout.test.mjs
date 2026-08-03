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
		assert.equal(timeStyles.color, 'rgb(79, 74, 66)'); // --muted light (#4F4A42)
		assert.match(timeStyles.fontFamily, /Inter|system-ui|Segoe UI|sans-serif/i);
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
		assert.match(await toggle.locator('.nav-toggle-label').innerText(), /close/i);
		assert.equal(await toggle.locator('.nav-toggle-icon').count(), 1);

		await page.keyboard.press('Escape');
		assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
		assert.equal(await page.locator('#site-nav a').first().isVisible(), false);

		await page.setViewportSize({ width: 1000, height: 800 });
		assert.equal(await toggle.isVisible(), false);
		assert.equal(await page.locator('#site-nav a').first().isVisible(), true);

		await page.close();
	});
});

test('content is fluid with 65ch reading measure', async () => {
	await withPreview(async ({ browser, baseURL }) => {
		const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
		await page.emulateMedia({ colorScheme: 'light' });

		await page.goto(`${baseURL}/`);
		const postsWidth = await page.locator('.posts').evaluate((el) => el.getBoundingClientRect().width);
		assert.ok(postsWidth > 700, `expected fluid .posts wider than 640px, got ${postsWidth}`);
		const excerptMax = await page.locator('.post-preview .excerpt').first().evaluate((el) => {
			for (const sheet of document.styleSheets) {
				try {
					for (const rule of sheet.cssRules) {
						if (rule.style?.maxWidth) {
							try {
								if (el.matches(rule.selectorText)) return rule.style.maxWidth;
							} catch {}
						}
					}
				} catch {}
			}
			return getComputedStyle(el).maxWidth;
		});
		assert.equal(excerptMax, '65ch');

		await page.goto(`${baseURL}/blog/`);
		const archiveWidth = await page.locator('.archive').evaluate((el) => el.getBoundingClientRect().width);
		assert.ok(archiveWidth > 700, `expected fluid .archive, got ${archiveWidth}`);

		await page.goto(`${baseURL}/right-sizing-government-websites/`);
		const postWidth = await page.locator('.post').evaluate((el) => el.getBoundingClientRect().width);
		const proseMax = await page.locator('.prose').evaluate((el) => {
			for (const sheet of document.styleSheets) {
				try {
					for (const rule of sheet.cssRules) {
						if (rule.style?.maxWidth) {
							try {
								if (el.matches(rule.selectorText)) return rule.style.maxWidth;
							} catch {}
						}
					}
				} catch {}
			}
			return getComputedStyle(el).maxWidth;
		});
		assert.ok(postWidth > 700, `expected fluid .post, got ${postWidth}`);
		assert.equal(proseMax, '65ch');

		await page.goto(`${baseURL}/learn-javascript-for-beginners/`);
		const pageWidth = await page.locator('.page').evaluate((el) => el.getBoundingClientRect().width);
		const pageProseMax = await page.locator('.prose').evaluate((el) => {
			for (const sheet of document.styleSheets) {
				try {
					for (const rule of sheet.cssRules) {
						if (rule.style?.maxWidth) {
							try {
								if (el.matches(rule.selectorText)) return rule.style.maxWidth;
							} catch {}
						}
					}
				} catch {}
			}
			return getComputedStyle(el).maxWidth;
		});
		assert.ok(pageWidth > 700, `expected fluid .page, got ${pageWidth}`);
		assert.equal(pageProseMax, '65ch');

		await page.close();
	});
});

test('prose images scale within the reading column', async () => {
	await withPreview(async ({ browser, baseURL }) => {
		const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
		await page.goto(`${baseURL}/union-rock/`);

		const img = page.locator('.prose img').first();
		await img.waitFor({ state: 'visible' });
		await img.evaluate((el) => {
			if (el.complete && el.naturalWidth > 0) return;
			return new Promise((resolve, reject) => {
				el.addEventListener('load', resolve, { once: true });
				el.addEventListener('error', () => reject(new Error('image failed to load')), { once: true });
			});
		});

		const sizes = await img.evaluate((el) => {
			const prose = el.closest('.prose');
			const cs = getComputedStyle(el);
			return {
				maxWidth: cs.maxWidth,
				imgWidth: el.getBoundingClientRect().width,
				imgHeight: el.getBoundingClientRect().height,
				proseWidth: prose.getBoundingClientRect().width,
				naturalWidth: el.naturalWidth,
				naturalHeight: el.naturalHeight,
			};
		});
		assert.equal(sizes.maxWidth, '100%');
		assert.ok(
			sizes.imgWidth <= sizes.proseWidth + 1,
			`expected img (${sizes.imgWidth}) within prose (${sizes.proseWidth})`,
		);
		const expectedRatio = sizes.naturalWidth / sizes.naturalHeight;
		const actualRatio = sizes.imgWidth / sizes.imgHeight;
		assert.ok(
			Math.abs(expectedRatio - actualRatio) < 0.05,
			`expected aspect ratio ~${expectedRatio}, got ${actualRatio}`,
		);

		await page.close();
	});
});

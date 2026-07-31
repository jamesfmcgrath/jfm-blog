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

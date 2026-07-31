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

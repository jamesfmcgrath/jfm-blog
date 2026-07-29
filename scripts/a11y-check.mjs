import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { preview } from 'astro';

const PATHS_TO_CHECK = ['/', '/blog/', '/right-sizing-government-websites/', '/learn-javascript-for-beginners/'];

async function checkPage(page, path, theme) {
	await page.goto(`http://localhost:4321${path}`);
	await page.evaluate((t) => {
		document.documentElement.dataset.theme = t;
	}, theme);
	const results = await new AxeBuilder({ page })
		// 'best-practice' is needed for heading-order, which carries no wcag2* tag.
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
		.analyze();

	if (results.violations.length > 0) {
		console.error(`\n${path} (${theme} mode): ${results.violations.length} violation(s)`);
		for (const violation of results.violations) {
			console.error(`  - [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s))`);
		}
	} else {
		console.log(`${path} (${theme} mode): OK`);
	}

	return results.violations.length;
}

async function main() {
	const previewServer = await preview({ root: process.cwd() });
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	let totalViolations = 0;
	for (const path of PATHS_TO_CHECK) {
		for (const theme of ['light', 'dark']) {
			totalViolations += await checkPage(page, path, theme);
		}
	}

	await browser.close();
	await previewServer.stop();

	if (totalViolations > 0) {
		console.error(`\n${totalViolations} total violation(s) found.`);
		process.exit(1);
	}
	console.log('\nAll pages pass with zero violations in both themes.');
}

main();

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function ogImage(html) {
	const m = html.match(/property="og:image" content="([^"]+)"/);
	assert.ok(m, 'expected og:image meta');
	return m[1];
}

test('home hero markup is present in the built home page', async () => {
	const html = await readFile('dist/index.html', 'utf8');
	assert.match(html, /class="home-hero"/);
	assert.match(html, /alt="James with a monkey"/);
});

test('home and archive share default og:image; featured post keeps its own', async () => {
	const homeHtml = await readFile('dist/index.html', 'utf8');
	const blogHtml = await readFile('dist/blog/index.html', 'utf8');
	const postHtml = await readFile(
		'dist/regular-maintenance-saves-time-money/index.html',
		'utf8',
	);

	const homeOg = ogImage(homeHtml);
	const blogOg = ogImage(blogHtml);
	const postOg = ogImage(postHtml);

	assert.equal(homeOg, blogOg, 'home and archive share the default OG image');
	assert.notEqual(postOg, homeOg, 'post with featured image must not use the default');
	assert.match(homeOg, /https:\/\/jamesfmcgrath\.org\/_astro\//);
});

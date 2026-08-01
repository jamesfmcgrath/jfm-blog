import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('footer social links use accessible icon labels', async () => {
	const html = await readFile('dist/index.html', 'utf8');
	for (const label of ['GitHub', 'LinkedIn', 'Bluesky', 'RSS feed']) {
		assert.match(
			html,
			new RegExp(`aria-label="${label}"`),
			`expected aria-label for ${label}`,
		);
	}
	assert.match(html, /aria-label="Social and feeds"/);
	assert.doesNotMatch(html, />GH</);
	assert.doesNotMatch(html, />LI</);
});

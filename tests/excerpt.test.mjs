import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveExcerpt } from '../src/lib/excerpt.ts';

test('strips markdown emphasis and headings', () => {
	const body = '# A heading\n\nSome **bold** and _italic_ text with a [link](https://example.com).';
	assert.equal(deriveExcerpt(body, 100), 'Some bold and italic text with a link.');
});

test('truncates on a word boundary and adds an ellipsis', () => {
	const body = 'one two three four five six seven eight nine ten';
	assert.equal(deriveExcerpt(body, 20), 'one two three four…');
});

test('returns short text unchanged', () => {
	assert.equal(deriveExcerpt('Short text.', 200), 'Short text.');
});

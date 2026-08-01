import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blogPostingJsonLd } from '../src/lib/blogposting-jsonld.ts';

test('builds BlogPosting JSON-LD with required fields', () => {
	const json = blogPostingJsonLd({
		title: 'The First Day',
		description: 'A short excerpt.',
		date: new Date('2026-07-31T00:00:00.000Z'),
		url: 'https://jamesfmcgrath.org/the-first-day/',
		imageUrl: 'https://jamesfmcgrath.org/_astro/cover.jpg',
		authorName: 'James F. McGrath',
	});

	assert.equal(json['@context'], 'https://schema.org');
	assert.equal(json['@type'], 'BlogPosting');
	assert.equal(json.headline, 'The First Day');
	assert.equal(json.datePublished, '2026-07-31');
	assert.deepEqual(json.image, ['https://jamesfmcgrath.org/_astro/cover.jpg']);
	assert.equal(json.author.name, 'James F. McGrath');
	assert.equal(json.mainEntityOfPage['@id'], 'https://jamesfmcgrath.org/the-first-day/');
});

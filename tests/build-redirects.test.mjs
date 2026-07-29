import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRedirects } from '../scripts/migrate-wordpress/build-redirects.mjs';

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:wp="urn">
<channel>
<item>
<link>https://jamesfmcgrath.org/mt-sample-background/</link>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
<item>
<link>https://jamesfmcgrath.org/a-real-post/</link>
<wp:post_type><![CDATA[post]]></wp:post_type>
</item>
</channel>
</rss>`;

test('redirects only attachment permalinks, to home', async () => {
	const result = await buildRedirects(FIXTURE_XML);
	assert.match(result, /RedirectMatch 301 \^\/mt-sample-background\/\$ \//);
	assert.doesNotMatch(result, /a-real-post/);
});

test('skips attachment with link matching a post permalink (collision)', async () => {
	const collisionXML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:wp="urn">
<channel>
<item>
<link>https://jamesfmcgrath.org/learning-javascript/</link>
<wp:post_type><![CDATA[post]]></wp:post_type>
</item>
<item>
<link>https://jamesfmcgrath.org/learning-javascript/</link>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
<item>
<link>https://jamesfmcgrath.org/featured-image/</link>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
</channel>
</rss>`;
	const result = await buildRedirects(collisionXML);
	// Should redirect the non-colliding attachment
	assert.match(result, /RedirectMatch 301 \^\/featured-image\/\$ \//);
	// Should NOT redirect the colliding attachment (that shares link with the post)
	assert.doesNotMatch(result, /learning-javascript/);
});

test('decodes percent-encoded non-ASCII paths (Apache matches the decoded path)', async () => {
	const encodedXML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:wp="urn">
<channel>
<item>
<link>https://jamesfmcgrath.org/dall%c2%b7e-2025-02-18-abstract/</link>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
</channel>
</rss>`;
	const result = await buildRedirects(encodedXML);
	assert.match(result, /RedirectMatch 301 \^\/dall·e-2025-02-18-abstract\/\$ \//);
	assert.doesNotMatch(result, /%c2%b7/i, 'must not emit percent-encoded octets');
});

test('collision detection compares decoded paths', async () => {
	// The post link is unencoded, the attachment link is percent-encoded: same path.
	const mixedXML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:wp="urn">
<channel>
<item>
<link>https://jamesfmcgrath.org/caf&#233;-notes/</link>
<wp:post_type><![CDATA[post]]></wp:post_type>
</item>
<item>
<link>https://jamesfmcgrath.org/caf%c3%a9-notes/</link>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
</channel>
</rss>`;
	const result = await buildRedirects(mixedXML);
	assert.doesNotMatch(result, /caf/, 'colliding attachment must not be redirected');
});

test('skips attachment with missing link element', async () => {
	const missingLinkXML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:wp="urn">
<channel>
<item>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
<item>
<link>https://jamesfmcgrath.org/valid-attachment/</link>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
</channel>
</rss>`;
	const result = await buildRedirects(missingLinkXML);
	// Should not crash, should redirect the valid one
	assert.match(result, /RedirectMatch 301 \^\/valid-attachment\/\$ \//);
	assert.doesNotMatch(result, /^\s*$/, 'should have content');
});

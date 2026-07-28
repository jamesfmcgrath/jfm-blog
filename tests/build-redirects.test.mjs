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

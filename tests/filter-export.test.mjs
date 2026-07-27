import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterExport } from '../scripts/migrate-wordpress/filter-export.mjs';

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:wp="urn">
<channel>
<title>Test</title>
<item>
<title><![CDATA[A Post]]></title>
<wp:post_id>1</wp:post_id>
<wp:post_type><![CDATA[post]]></wp:post_type>
<wp:status><![CDATA[publish]]></wp:status>
</item>
<item>
<title><![CDATA[Some Stat]]></title>
<wp:post_id>2</wp:post_id>
<wp:post_type><![CDATA[wpa-stats]]></wp:post_type>
<wp:status><![CDATA[publish]]></wp:status>
</item>
<item>
<title><![CDATA[Contact (Theme)]]></title>
<wp:post_id>3</wp:post_id>
<wp:post_type><![CDATA[page]]></wp:post_type>
<wp:status><![CDATA[draft]]></wp:status>
</item>
<item>
<title><![CDATA[Learn JavaScript]]></title>
<wp:post_id>1039</wp:post_id>
<wp:post_type><![CDATA[page]]></wp:post_type>
<wp:status><![CDATA[publish]]></wp:status>
</item>
<item>
<title><![CDATA[An Image]]></title>
<wp:post_id>4</wp:post_id>
<wp:post_type><![CDATA[attachment]]></wp:post_type>
</item>
</channel>
</rss>`;

test('keeps posts, the one real page, and attachments; drops everything else', async () => {
	const result = await filterExport(FIXTURE_XML);
	assert.match(result, /A Post/);
	assert.match(result, /Learn JavaScript/);
	assert.match(result, /An Image/);
	assert.doesNotMatch(result, /Some Stat/);
	assert.doesNotMatch(result, /Contact \(Theme\)/);
});

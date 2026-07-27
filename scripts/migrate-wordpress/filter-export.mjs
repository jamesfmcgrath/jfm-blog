import { readFile, writeFile } from 'node:fs/promises';
import xml2js from 'xml2js';

const KEEP_PAGE_POST_ID = '1039';

export async function filterExport(xmlString) {
	const parsed = await xml2js.parseStringPromise(xmlString);
	const channel = parsed.rss.channel[0];
	const items = channel.item ?? [];

	channel.item = items.filter((item) => {
		const postType = item['wp:post_type']?.[0];
		const postId = item['wp:post_id']?.[0];

		if (postType === 'post') return true;
		if (postType === 'attachment') return true;
		if (postType === 'page' && postId === KEEP_PAGE_POST_ID) return true;
		return false;
	});

	const builder = new xml2js.Builder();
	return builder.buildObject(parsed);
}

async function main() {
	const [, , inputPath, outputPath] = process.argv;
	if (!inputPath || !outputPath) {
		console.error('Usage: node filter-export.mjs <input.xml> <output.xml>');
		process.exit(1);
	}

	const xml = await readFile(inputPath, 'utf8');
	const filtered = await filterExport(xml);
	await writeFile(outputPath, filtered, 'utf8');
	console.log(`Wrote filtered export to ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}

export function deriveExcerpt(body: string, max = 200): string {
	const plain = body
		.replace(/^#{1,6}\s+.*$/gm, '')
		.replace(/`{1,3}[^`]*`{1,3}/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();

	if (plain.length <= max) {
		return plain;
	}

	const truncated = plain.slice(0, max);
	const lastSpace = truncated.lastIndexOf(' ');
	return truncated.slice(0, lastSpace > 0 ? lastSpace : max) + '…';
}

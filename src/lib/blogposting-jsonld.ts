export type BlogPostingInput = {
	title: string;
	description: string;
	date: Date;
	url: string;
	imageUrl: string;
	authorName: string;
};

export function blogPostingJsonLd({
	title,
	description,
	date,
	url,
	imageUrl,
	authorName,
}: BlogPostingInput): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: title,
		description,
		datePublished: date.toISOString().slice(0, 10),
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': url,
		},
		image: [imageUrl],
		author: {
			'@type': 'Person',
			name: authorName,
			url: new URL('/', url).href,
		},
		publisher: {
			'@type': 'Person',
			name: authorName,
			url: new URL('/', url).href,
		},
	};
}

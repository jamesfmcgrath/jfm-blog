// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	site: 'https://jamesfmcgrath.org',
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Source Serif 4',
			cssVariable: '--font-source-serif',
			fallbacks: ['Georgia', 'serif'],
			weights: [400, 500, 600],
			styles: ['normal', 'italic'],
		},
		{
			provider: fontProviders.google(),
			name: 'Zen Kaku Gothic New',
			cssVariable: '--font-zen-kaku',
			fallbacks: ['sans-serif'],
			weights: [400, 500, 700],
		},
		{
			provider: fontProviders.google(),
			name: 'JetBrains Mono',
			cssVariable: '--font-jetbrains-mono',
			fallbacks: ['monospace'],
			weights: [400, 500],
		},
	],
});

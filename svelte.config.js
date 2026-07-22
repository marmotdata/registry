import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: /** @type {'' | `/${string}`} */ (process.env.BASE_PATH ?? '')
		},
		prerender: {
			handleHttpError: ({ path, referrer, message, status }) => {
				// Plugin detail pages embed upstream docs whose links reference
				// pages in the source doc site, not routes here. Let those 404s pass.
				if (status === 404) {
					console.warn(`Skipping broken link: ${path} (from ${referrer})`);
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;

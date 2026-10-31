/// <reference types="@marmotdata/svelte" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

// mm-icon and mm-provider-logo come from @marmotdata/icons, which @marmotdata/svelte does not type.
declare module 'svelte/elements' {
	interface SvelteHTMLElements {
		'mm-icon': HTMLAttributes<HTMLElement> & { name?: string; label?: string; size?: number };
		'mm-provider-logo': HTMLAttributes<HTMLElement> & {
			provider?: string;
			size?: number;
			decorative?: boolean;
		};
	}
}

export {};

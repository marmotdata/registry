import typography from '@tailwindcss/typography';

/** rgb-triplet CSS variable → Tailwind colour with alpha support */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			// Four working sizes. xs for metadata and tags, sm for UI and body copy in
			// dense layouts, base for reading, lg for lead paragraphs. Nothing under 13px.
			fontSize: {
				xs: ['0.8125rem', { lineHeight: '1.25rem' }],
				sm: ['0.9375rem', { lineHeight: '1.5rem' }],
				base: ['1rem', { lineHeight: '1.625rem' }],
				lg: ['1.125rem', { lineHeight: '1.75rem' }],
				xl: ['1.25rem', { lineHeight: '1.75rem' }],
				'2xl': ['1.5rem', { lineHeight: '2rem' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
				'5xl': ['3rem', { lineHeight: '1.08' }],
				code: ['0.875rem', { lineHeight: '1.65' }]
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
				mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
			},
			colors: {
				// Semantic tokens — defined per theme in app.css.
				page: v('--c-page'),
				surface: v('--c-surface'),
				'surface-2': v('--c-surface-2'),
				'surface-3': v('--c-surface-3'),
				line: v('--c-line'),
				'line-strong': v('--c-line-strong'),
				ink: v('--c-ink'),
				'ink-muted': v('--c-ink-muted'),
				'ink-subtle': v('--c-ink-subtle'),
				accent: v('--c-accent'),
				'accent-strong': v('--c-accent-strong'),
				'accent-soft': v('--c-accent-soft'),
				'accent-ink': v('--c-accent-ink'),

				gray: {
					50: '#F9F9F9',
					100: '#ECECEC',
					200: '#DFDFDF',
					300: '#CCCCCC',
					400: '#B0B0B0',
					500: '#8F8F8F',
					600: '#696969',
					700: '#4D4D4D',
					800: '#2E2E2E',
					900: '#1A1A1A'
				},
				'earthy-green': {
					50: '#f9faf8',
					100: '#f4f7f5',
					200: '#e8f0e8',
					300: '#d1dfd1',
					400: '#b9cdb9',
					500: '#8ba88b',
					600: '#75927f',
					700: '#607b60',
					800: '#4a674a',
					900: '#35593b'
				},
				'earthy-brown': {
					50: '#fefcfb',
					100: '#f9f7f5',
					200: '#f0ece8',
					300: '#e2d9d1',
					400: '#c6b4a2',
					500: '#b8a28b',
					600: '#a98f75',
					700: '#997c60',
					800: '#8a6a4a',
					900: '#7b5935'
				},
				'earthy-yellow': {
					50: '#fefdf8',
					100: '#fdf8f2',
					200: '#fbf1e5',
					300: '#f6e6c9',
					400: '#ecd292',
					500: '#e7c776',
					600: '#ddb65c',
					700: '#d4a442',
					800: '#cb9228',
					900: '#c2810f'
				},
				'earthy-terracotta': {
					50: '#fff6f3',
					100: '#ffe9e1',
					200: '#ffd7c8',
					300: '#ffbea5',
					400: '#ffa382',
					500: '#ff8a66',
					600: '#f5704a',
					700: '#d25a30',
					800: '#b34822',
					900: '#8d3718'
				},
				'earthy-blue': {
					50: '#f9fafb',
					100: '#f4f7f9',
					200: '#e8edf0',
					300: '#d1dbe2',
					400: '#a2b4c6',
					500: '#8ba0b8',
					600: '#758c9f',
					700: '#607985',
					800: '#4a656f',
					900: '#355159'
				}
			},
			boxShadow: {
				card: '0 1px 2px rgb(20 16 12 / 0.04), 0 1px 3px rgb(20 16 12 / 0.03)',
				'card-hover':
					'0 1px 2px rgb(20 16 12 / 0.04), 0 8px 24px -8px rgb(210 90 48 / 0.18), 0 12px 32px -16px rgb(20 16 12 / 0.16)',
				pop: '0 8px 30px -8px rgb(20 16 12 / 0.25)'
			},
			borderRadius: {
				'2.5xl': '1.25rem'
			},
			letterSpacing: {
				tightest: '-0.03em'
			},
			keyframes: {
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(6px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'fade-up': 'fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both'
			}
		}
	},
	plugins: [typography]
};

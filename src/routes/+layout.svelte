<script lang="ts">
	import '@marmotdata/tokens/index.css';
	import '@marmotdata/css';
	import '../app.css';
	import '$lib/elements';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import NavProgress from '$lib/components/NavProgress.svelte';
	import { SITE_NAME, SOCIAL_IMAGE } from '$lib/site';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();

	const year = new Date().getFullYear();

	const footerLinks = [
		{ label: 'Docs', href: 'https://marmotdata.io/docs/introduction' },
		{ label: 'Build a plugin', href: 'https://marmotdata.io/docs/Develop/creating-plugins' },
		{ label: 'Registry source', href: 'https://github.com/marmotdata/registry' },
		{ label: 'Community', href: 'https://discord.gg/TWCk7hVFN4' }
	];
</script>

<svelte:head>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:image" content={SOCIAL_IMAGE} />
	<meta property="og:image:width" content="2400" />
	<meta property="og:image:height" content="1260" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={SOCIAL_IMAGE} />
</svelte:head>

<a class="skip mm-visually-hidden" href="#main">Skip to content</a>
<NavProgress />

<div class="shell">
	<SiteHeader />

	<main id="main" class="page">
		{@render children?.()}
	</main>

	<footer class="footer">
		<div class="footer-inner">
			<p class="mm-caption">
				© {year} Marmot. Plugins are published as OCI artifacts in
				<a class="mm-link" href="https://github.com/orgs/marmotdata/packages" target="_blank" rel="noopener"
					>ghcr.io/marmotdata/plugins</a
				>.
			</p>
			<nav aria-label="Footer">
				<ul>
					{#each footerLinks as link (link.href)}
						<li>
							<a href={link.href} target="_blank" rel="noopener">
								{link.label}<span class="mm-visually-hidden"> (opens in a new tab)</span>
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</footer>
</div>

<style>
	.skip:focus {
		position: fixed;
		inset-block-start: var(--space-2);
		inset-inline-start: var(--space-2);
		z-index: var(--mm-z-toast);
		padding: var(--space-2) var(--space-3);
		background: var(--mm-raised);
		color: var(--mm-text);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-float);
	}
	.shell {
		display: flex;
		flex-direction: column;
		min-block-size: 100vh;
	}
	.page {
		flex: 1;
		inline-size: 100%;
		max-inline-size: 1600px;
		margin-inline: auto;
		padding: var(--space-8) var(--space-8) var(--space-12);
		box-sizing: border-box;
	}
	.footer {
		border-block-start: 1px solid var(--mm-rule);
	}
	.footer-inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4) var(--space-8);
		max-inline-size: 1600px;
		margin-inline: auto;
		padding: var(--space-6) var(--space-8);
		box-sizing: border-box;
	}
	.footer p {
		margin: 0;
	}
	.footer ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.footer nav a {
		font: var(--text-caption);
		color: var(--mm-text-2);
		text-decoration: none;
	}
	.footer nav a:hover,
	.footer nav a:focus-visible {
		color: var(--mm-text);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	@media (max-width: 720px) {
		.page {
			padding: var(--space-6) var(--space-4) var(--space-12);
		}
		.footer-inner {
			padding-inline: var(--space-4);
		}
	}
</style>

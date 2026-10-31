<!--
  The marmotdata.io site header, shared with the docs and marketing pages. The design system has an
  app top bar (mm-top-bar) but no public-site header, so this one is composed from the wordmark,
  mm-button and tokens.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { setTheme } from '@marmotdata/svelte';

	type NavItem = { label: string; href: string; current?: boolean; external?: boolean };

	const items: NavItem[] = [
		{ label: 'Docs', href: 'https://marmotdata.io/docs/introduction' },
		{ label: 'Plugins', href: 'https://plugins.marmotdata.io', current: true },
		{ label: 'Pricing', href: 'https://marmotdata.io/pricing' },
		{ label: 'Resources', href: 'https://marmotdata.io/resources' },
		{ label: 'Blog', href: 'https://marmotdata.io/blog' },
		{ label: 'Community', href: 'https://discord.gg/TWCk7hVFN4', external: true }
	];

	let menuOpen = $state(false);
	let dark = $state(false);
	let mounted = $state(false);

	function effectiveDark(): boolean {
		const set = document.documentElement.dataset.theme;
		if (set) return set === 'dark';
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	onMount(() => {
		dark = effectiveDark();
		mounted = true;
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => (dark = effectiveDark());
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function toggleTheme() {
		dark = !dark;
		setTheme(dark ? 'dark' : 'light');
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) {
			menuOpen = false;
			document.getElementById('site-menu-button')?.focus();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<header class="site-header">
	<div class="inner">
		<span class="menu-toggle">
			<mm-button
				id="site-menu-button"
				variant="ghost"
				icon={menuOpen ? 'close' : 'menu'}
				label={menuOpen ? 'Close menu' : 'Open menu'}
				expanded={menuOpen ? 'true' : 'false'}
				controls="site-menu"
				onclick={() => (menuOpen = !menuOpen)}
			></mm-button>
		</span>

		<a class="brand" href="https://marmotdata.io" aria-label="Marmot">
			<mm-logo size={22} label=""></mm-logo>
		</a>

		<nav class="nav" aria-label="Marmot">
			{#each items as item (item.href)}
				<a
					href={item.href}
					aria-current={item.current ? 'page' : undefined}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener' : undefined}
				>
					{item.label}
					{#if item.external}
						<mm-icon name="open-in-new" size={14}></mm-icon>
						<span class="mm-visually-hidden">(opens in a new tab)</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="end">
			<mm-button
				variant="ghost"
				href="https://github.com/marmotdata/marmot"
				target="_blank"
				label="Marmot on GitHub"
			>
				<mm-provider-logo slot="icon" provider="github" size={16} decorative></mm-provider-logo>
			</mm-button>
			{#if mounted}
				<mm-button
					variant="ghost"
					icon={dark ? 'light-mode' : 'dark-mode'}
					label={dark ? 'Use light theme' : 'Use dark theme'}
					onclick={toggleTheme}
				></mm-button>
			{/if}
			<mm-button class="sign-in" variant="ghost" href="https://cloud.marmotdata.io/login">Sign in</mm-button>
			<mm-button variant="primary" href="https://cloud.marmotdata.io/signup">Start for free</mm-button>
		</div>
	</div>

	{#if menuOpen}
		<nav id="site-menu" class="menu" aria-label="Marmot">
			{#each items as item (item.href)}
				<a
					href={item.href}
					aria-current={item.current ? 'page' : undefined}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener' : undefined}
					onclick={() => (menuOpen = false)}
				>
					{item.label}
					{#if item.external}
						<mm-icon name="open-in-new" size={14}></mm-icon>
						<span class="mm-visually-hidden">(opens in a new tab)</span>
					{/if}
				</a>
			{/each}
		</nav>
	{/if}
</header>

<style>
	.site-header {
		position: sticky;
		inset-block-start: 0;
		z-index: var(--mm-z-sticky);
		background: var(--mm-chrome);
		border-block-end: 1px solid var(--mm-rule);
	}
	.inner {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		max-inline-size: 1600px;
		margin-inline: auto;
		padding: var(--space-3) var(--space-8);
	}
	.brand {
		display: inline-flex;
		border-radius: var(--radius-sm);
	}
	.nav {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		flex: 1;
		min-inline-size: 0;
	}
	.nav a,
	.menu a {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font: var(--text-button);
		letter-spacing: var(--tracking-button);
		color: var(--mm-text-2);
		text-decoration: none;
		transition: color var(--mm-dur-press) var(--mm-ease);
	}
	.nav a {
		padding-block: var(--space-2);
	}
	.nav a:hover,
	.menu a:hover {
		color: var(--mm-text);
	}
	.nav a[aria-current='page'],
	.menu a[aria-current='page'] {
		color: var(--mm-text);
	}
	/* The current section is marked like the active tab: an ink word over a burnt-sienna rule. */
	.nav a[aria-current='page']::after {
		content: '';
		position: absolute;
		inset-inline: 0;
		inset-block-end: calc(-1 * var(--space-3) - 1px);
		block-size: 2px;
		background: var(--mm-primary);
	}
	.end {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin-inline-start: auto;
	}
	.end .sign-in {
		margin-inline-start: var(--space-2);
	}
	.menu-toggle {
		display: none;
	}
	.menu {
		display: none;
	}

	@media (max-width: 880px) {
		.inner {
			gap: var(--space-2);
			padding-inline: var(--space-4);
		}
		.menu-toggle {
			display: contents;
		}
		.nav,
		.end .sign-in {
			display: none;
		}
		.menu {
			display: grid;
			padding: var(--space-2) var(--space-4) var(--space-4);
			border-block-start: 1px solid var(--mm-rule);
		}
		.menu a {
			min-block-size: var(--target-touch);
			font: var(--text-body);
		}
		.menu a[aria-current='page'] {
			font: var(--text-body-strong);
		}
	}
</style>

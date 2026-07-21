<!--
  Canonical Marmot marketing/docs header, ported to Svelte.

  This file is the source of truth for the header used on Marmot's Svelte
  properties (registry, etc.). Copy it verbatim into
  <project>/src/lib/components/Header.svelte — no edits, no local tweaks.

  Structure and measurements mirror the Docusaurus navbar shipped by
  web/docs (Infima + custom.css overrides):
    - height 3.75rem (60px)
    - padding 0.5rem 1rem
    - glassmorphic bg: rgba(254, 252, 251, 0.8) light / rgba(26, 26, 26, 0.8) dark
    - Inter font, nav link 0.9rem / weight 500 / letter-spacing -0.01em
    - orange gradient "Live Demo" pill on the right
  Dark mode is triggered by the `.dark` class on <html> (matches SvelteKit
  convention). If your host site uses `[data-theme="dark"]` instead, add a
  duplicate selector.
-->
<script lang="ts">
	import { Menu, X } from 'lucide-svelte';

	type NavItem = { label: string; href: string; external?: boolean };

	interface Props {
		logoLight?: string;
		logoDark?: string;
		homeHref?: string;
		leftItems?: NavItem[];
		githubHref?: string;
		demoLabel?: string;
		demoHref?: string;
	}

	let {
		logoLight = 'https://marmotdata.io/img/marmot-text.svg',
		logoDark = 'https://marmotdata.io/img/marmot-text-light.svg',
		homeHref = 'https://marmotdata.io',
		leftItems = [
			{ label: 'Docs', href: 'https://marmotdata.io/docs/introduction' },
			{ label: 'Pricing', href: 'https://marmotdata.io/pricing' },
			{ label: 'Resources', href: 'https://marmotdata.io/resources' },
			{ label: 'Blog', href: 'https://marmotdata.io/blog' },
			{ label: 'Community', href: 'https://discord.gg/TWCk7hVFN4', external: true }
		],
		githubHref = 'https://github.com/marmotdata/marmot',
		demoLabel = 'Live Demo',
		demoHref = 'https://demo.marmotdata.io'
	}: Props = $props();

	let mobileOpen = $state(false);

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<nav class="navbar">
	<div class="navbar__inner">
		<div class="navbar__items">
			<button
				type="button"
				class="navbar__toggle"
				aria-label="Toggle navigation menu"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				<Menu size={22} strokeWidth={2} />
			</button>

			<a href={homeHref} class="navbar__brand" aria-label="Marmot">
				<div class="navbar__logo">
					<img src={logoLight} alt="Marmot" class="logo-light" />
					<img src={logoDark} alt="Marmot" class="logo-dark" />
				</div>
			</a>

			{#each leftItems as item (item.href)}
				<a
					href={item.href}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener noreferrer' : undefined}
					class="navbar__item navbar__link"
				>
					{item.label}
					{#if item.external}
						<svg
							class="external-icon"
							width="13.5"
							height="13.5"
							aria-hidden="true"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 6.892 2.061 2.031 6.977-6.892 4.032 3.977v-10.008z"
							/>
						</svg>
					{/if}
				</a>
			{/each}
		</div>

		<div class="navbar__items navbar__items--right">
			<a
				href={githubHref}
				target="_blank"
				rel="noopener noreferrer"
				aria-label="GitHub repository"
				class="navbar__item header-github-link"
			></a>
			<a
				href={demoHref}
				target="_blank"
				rel="noopener noreferrer"
				class="navbar__item navbar__link demo-button"
			>
				{demoLabel}
				<svg
					class="external-icon"
					width="13.5"
					height="13.5"
					aria-hidden="true"
					viewBox="0 0 24 24"
				>
					<path
						fill="currentColor"
						d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 6.892 2.061 2.031 6.977-6.892 4.032 3.977v-10.008z"
					/>
				</svg>
			</a>
		</div>
	</div>

	{#if mobileOpen}
		<div class="navbar__sidebar">
			<div class="navbar__sidebar-header">
				<a href={homeHref} class="navbar__brand" onclick={closeMobile} aria-label="Marmot">
					<div class="navbar__logo">
						<img src={logoLight} alt="Marmot" class="logo-light" />
						<img src={logoDark} alt="Marmot" class="logo-dark" />
					</div>
				</a>
				<button
					type="button"
					class="navbar__toggle"
					aria-label="Close navigation menu"
					onclick={closeMobile}
				>
					<X size={22} strokeWidth={2} />
				</button>
			</div>
			<div class="navbar__sidebar-menu">
				{#each leftItems as item (item.href)}
					<a
						href={item.href}
						target={item.external ? '_blank' : undefined}
						rel={item.external ? 'noopener noreferrer' : undefined}
						class="navbar__sidebar-link"
						onclick={closeMobile}
					>
						{item.label}
						{#if item.external}
							<svg
								class="external-icon"
								width="13.5"
								height="13.5"
								aria-hidden="true"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 6.892 2.061 2.031 6.977-6.892 4.032 3.977v-10.008z"
								/>
							</svg>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</nav>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		height: 3.75rem;
		padding: 0.5rem 1rem;
		background: rgba(254, 252, 251, 0.8);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
			Roboto, sans-serif;
		transition: background-color 0.3s ease, box-shadow 0.3s ease;
	}
	:global(.dark) .navbar,
	:global([data-theme='dark']) .navbar {
		background: rgba(26, 26, 26, 0.8);
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}

	.navbar__inner {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		width: 100%;
	}

	.navbar__items {
		align-items: center;
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.navbar__items--right {
		flex: 0 0 auto;
		justify-content: flex-end;
		gap: 0.25rem;
	}

	.navbar__brand {
		align-items: center;
		display: flex;
		margin-right: 1rem;
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	.navbar__logo {
		flex: 0 0 auto;
		height: 1.5rem;
		margin-right: 0.5rem;
	}
	.navbar__logo img {
		height: 100%;
		width: auto;
	}
	.logo-dark {
		display: none;
	}
	:global(.dark) .navbar .logo-light,
	:global([data-theme='dark']) .navbar .logo-light {
		display: none;
	}
	:global(.dark) .navbar .logo-dark,
	:global([data-theme='dark']) .navbar .logo-dark {
		display: block;
	}

	.navbar__item {
		display: inline-block;
		padding: 0.25rem 0.75rem;
	}

	.navbar__link {
		display: inline-flex;
		align-items: center;
		font-weight: 500;
		font-size: 0.9rem;
		letter-spacing: -0.01em;
		color: #4b5563;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: color 0.2s ease, background-color 0.2s ease;
	}
	.external-icon {
		margin-left: 0.3rem;
	}
	.navbar__link:hover {
		color: #d25a30;
		background-color: rgba(210, 90, 48, 0.06);
		text-decoration: none;
	}
	:global(.dark) .navbar__link,
	:global([data-theme='dark']) .navbar__link {
		color: #d1d5db;
	}
	:global(.dark) .navbar__link:hover,
	:global([data-theme='dark']) .navbar__link:hover {
		color: #f7885e;
		background-color: rgba(247, 136, 94, 0.1);
	}

	.header-github-link {
		width: 24px;
		height: 24px;
		display: inline-flex;
		background: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' fill='%234b5563'/%3E%3C/svg%3E")
			no-repeat;
		background-size: contain;
		padding: 0;
		margin: 0 0.5rem;
		transition: opacity 0.2s ease;
	}
	.header-github-link:hover {
		opacity: 0.7;
	}
	:global(.dark) .header-github-link,
	:global([data-theme='dark']) .header-github-link {
		background: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' fill='%23d1d5db'/%3E%3C/svg%3E")
			no-repeat;
		background-size: contain;
	}

	.demo-button {
		background: linear-gradient(135deg, #d25a30 0%, #e86f42 100%);
		color: white;
		padding: 0.4rem 1.1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.85rem;
		letter-spacing: -0.01em;
		border: none;
		box-shadow: 0 1px 3px rgba(210, 90, 48, 0.2);
		margin-right: 0;
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.demo-button:hover {
		background: linear-gradient(135deg, #c04e28 0%, #d25a30 100%);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(210, 90, 48, 0.25);
	}
	:global(.dark) .demo-button,
	:global([data-theme='dark']) .demo-button {
		background: linear-gradient(135deg, #e86f42 0%, #f7885e 100%);
		box-shadow: 0 1px 3px rgba(232, 111, 66, 0.3);
	}
	:global(.dark) .demo-button:hover,
	:global([data-theme='dark']) .demo-button:hover {
		background: linear-gradient(135deg, #d25a30 0%, #e86f42 100%);
		box-shadow: 0 4px 12px rgba(232, 111, 66, 0.3);
	}

	.navbar__toggle {
		display: none;
		margin-right: 0.5rem;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: transparent;
		border: none;
		color: #4b5563;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: color 0.2s ease, background-color 0.2s ease;
	}
	.navbar__toggle:hover {
		color: #d25a30;
		background-color: rgba(210, 90, 48, 0.06);
	}
	:global(.dark) .navbar__toggle,
	:global([data-theme='dark']) .navbar__toggle {
		color: #d1d5db;
	}
	:global(.dark) .navbar__toggle:hover,
	:global([data-theme='dark']) .navbar__toggle:hover {
		color: #f7885e;
		background-color: rgba(247, 136, 94, 0.1);
	}

	.navbar__sidebar {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: rgba(254, 252, 251, 0.98);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}
	:global(.dark) .navbar__sidebar,
	:global([data-theme='dark']) .navbar__sidebar {
		background: rgba(26, 26, 26, 0.98);
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}
	.navbar__sidebar-header {
		display: none;
	}
	.navbar__sidebar-menu {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 1rem 1rem;
		gap: 0.25rem;
	}
	.navbar__sidebar-link {
		display: inline-flex;
		align-items: center;
		font-family: inherit;
		font-weight: 500;
		font-size: 0.95rem;
		letter-spacing: -0.01em;
		color: #4b5563;
		padding: 0.6rem 0.75rem;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: color 0.2s ease, background-color 0.2s ease;
	}
	.navbar__sidebar-link:hover {
		color: #d25a30;
		background-color: rgba(210, 90, 48, 0.06);
	}
	:global(.dark) .navbar__sidebar-link,
	:global([data-theme='dark']) .navbar__sidebar-link {
		color: #d1d5db;
	}
	:global(.dark) .navbar__sidebar-link:hover,
	:global([data-theme='dark']) .navbar__sidebar-link:hover {
		color: #f7885e;
		background-color: rgba(247, 136, 94, 0.1);
	}

	@media (max-width: 996px) {
		.navbar__toggle {
			display: inline-flex;
		}
		.navbar__items .navbar__item:not(.navbar__toggle):not(.navbar__brand) {
			display: none;
		}
		.navbar__items--right .header-github-link,
		.navbar__items--right .demo-button {
			display: inline-flex;
		}
		.demo-button {
			padding: 0.35rem 0.9rem;
			font-size: 0.8rem;
		}
	}
</style>

<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import FloatingThemeToggle from '$lib/components/FloatingThemeToggle.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();

	const year = new Date().getFullYear();
</script>

<div class="flex min-h-screen flex-col">
	<Header logoLight="{base}/img/marmot-text.svg" logoDark="{base}/img/marmot-text-light.svg" />

	<main class="mx-auto w-full max-w-[96rem] flex-1 px-5 pb-16 pt-8 sm:px-8">
		{@render children?.()}
	</main>

	<footer class="border-t border-line pb-10 sm:pb-0">
		<div
			class="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-5 py-8 text-sm text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pr-20"
		>
			<p class="m-0">
				© {year} Marmot. Plugins are published as OCI artifacts under
				<a
					href="https://github.com/orgs/marmotdata/packages"
					class="font-mono text-ink-muted hover:text-accent"
					target="_blank"
					rel="noopener">ghcr.io/marmotdata/plugins</a
				>.
			</p>
			<nav class="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Footer">
				<a href="https://marmotdata.io/docs/introduction" class="hover:text-accent" target="_blank" rel="noopener">Docs</a>
				<a href="https://marmotdata.io/docs/Develop/creating-plugins" class="hover:text-accent" target="_blank" rel="noopener">Build a plugin</a>
				<a href="https://github.com/marmotdata/registry" class="hover:text-accent" target="_blank" rel="noopener">Registry source</a>
				<a href="https://discord.gg/TWCk7hVFN4" class="hover:text-accent" target="_blank" rel="noopener">Community</a>
			</nav>
		</div>
	</footer>

	<FloatingThemeToggle />
</div>

<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import { Github } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();
</script>

<div class="min-h-screen flex flex-col">
	<header class="glass-navbar sticky top-0 z-10">
		<div class="mx-auto max-w-[86rem] px-6 py-3 flex items-center justify-between">
			<a
				href="{base}/"
				class="flex items-center gap-2 no-underline"
				aria-label="Marmot Registry"
			>
				<img
					src="{base}/img/marmot-text.svg"
					alt=""
					class="block h-6 w-auto dark:hidden"
				/>
				<img
					src="{base}/img/marmot-text-light.svg"
					alt=""
					class="hidden h-6 w-auto dark:block"
				/>
				<span
					class="text-lg font-bold text-earthy-terracotta-700 dark:text-earthy-terracotta-400 tracking-tight"
				>
					Registry
				</span>
			</a>
			<div class="flex items-center gap-1">
				<a
					href="https://github.com/marmotdata/marmot"
					target="_blank"
					rel="noopener"
					aria-label="GitHub"
					class="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-earthy-brown-100 dark:hover:bg-gray-800 transition-colors"
				>
					<Github size={18} />
				</a>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<main class="flex-1 mx-auto w-full max-w-[86rem] px-6 py-8">
		{@render children?.()}
	</main>

	<footer
		class="mx-auto w-full max-w-[86rem] px-6 py-8 text-sm text-gray-500 dark:text-gray-400"
	>
		<div class="border-t border-gray-200 dark:border-gray-800 pt-6">
			Marmot Plugin Registry &middot;
			<a href="{base}/plugins.json" class="hover:underline">plugins.json</a>
			&middot;
			<a
				href="https://github.com/marmotdata/marmot"
				target="_blank"
				rel="noopener"
				class="hover:underline">GitHub</a
			>
		</div>
	</footer>
</div>

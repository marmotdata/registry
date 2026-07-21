<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import Header from '$lib/components/Header.svelte';
	import FloatingThemeToggle from '$lib/components/FloatingThemeToggle.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Header
		logoLight="{base}/img/marmot-text.svg"
		logoDark="{base}/img/marmot-text-light.svg"
	/>

	<main class="flex-1 mx-auto w-full max-w-[86rem] px-6 py-8">
		{@render children?.()}
	</main>

	<FloatingThemeToggle />
</div>

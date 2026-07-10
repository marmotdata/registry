<script lang="ts">
	import { Search } from 'lucide-svelte';
	import PluginCard from '$lib/components/PluginCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let selectedCategory = $state<string | null>(null);

	const categories = $derived(
		Array.from(new Set(data.plugins.map((p) => p.category).filter((c): c is string => !!c))).sort()
	);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return data.plugins.filter((p) => {
			if (selectedCategory && p.category !== selectedCategory) return false;
			if (!q) return true;
			return (
				p.name.toLowerCase().includes(q) ||
				p.display_name.toLowerCase().includes(q) ||
				p.description.toLowerCase().includes(q) ||
				(p.category?.toLowerCase().includes(q) ?? false) ||
				p.features.some((f) => f.toLowerCase().includes(q))
			);
		});
	});
</script>

<svelte:head>
	<title>Marmot Plugin Registry</title>
</svelte:head>

<section class="mb-8">
	<h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
		Discover Marmot <span class="text-earthy-terracotta-700 dark:text-earthy-terracotta-400"
			>plugins</span
		>
	</h1>
	<p class="mt-2 text-gray-600 dark:text-gray-400">
		{data.pluginCount} plugins to connect Marmot to your data.
	</p>
</section>

<section class="mb-6 space-y-3">
	<div class="relative">
		<Search
			size={16}
			class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
		/>
		<input
			type="search"
			placeholder="Search plugins..."
			bind:value={query}
			class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-earthy-terracotta-700 focus:outline-none focus:ring-1 focus:ring-earthy-terracotta-700 transition-colors"
		/>
	</div>

	<div class="flex flex-wrap gap-1.5">
		<button
			type="button"
			onclick={() => (selectedCategory = null)}
			class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {selectedCategory ===
			null
				? 'border-earthy-terracotta-700 bg-earthy-terracotta-50 text-earthy-terracotta-800 dark:border-earthy-terracotta-400 dark:bg-earthy-terracotta-900/30 dark:text-earthy-terracotta-200'
				: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'}"
		>
			All
		</button>
		{#each categories as cat (cat)}
			<button
				type="button"
				onclick={() => (selectedCategory = selectedCategory === cat ? null : cat)}
				class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {selectedCategory ===
				cat
					? 'border-earthy-terracotta-700 bg-earthy-terracotta-50 text-earthy-terracotta-800 dark:border-earthy-terracotta-400 dark:bg-earthy-terracotta-900/30 dark:text-earthy-terracotta-200'
					: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'}"
			>
				{cat}
			</button>
		{/each}
	</div>
</section>

<section>
	{#if filtered.length === 0}
		<div class="py-8 text-center text-gray-500 dark:text-gray-400">
			No plugins found matching "{query}"
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filtered as plugin (plugin.namespace + '/' + plugin.name)}
				<PluginCard {plugin} />
			{/each}
		</div>
	{/if}
</section>

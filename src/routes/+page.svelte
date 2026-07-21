<script lang="ts">
	import { Search, X } from 'lucide-svelte';
	import PluginCard from '$lib/components/PluginCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let selectedTiers = $state<string[]>([]);
	let selectedCategories = $state<string[]>([]);

	const categories = $derived(
		Array.from(new Set(data.plugins.map((p) => p.category).filter((c): c is string => !!c))).sort()
	);

	function tierOf(p: (typeof data.plugins)[number]): 'official' | 'community' {
		return p.official ? 'official' : 'community';
	}

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return data.plugins.filter((p) => {
			if (selectedTiers.length > 0 && !selectedTiers.includes(tierOf(p))) return false;
			if (
				selectedCategories.length > 0 &&
				(!p.category || !selectedCategories.includes(p.category))
			) {
				return false;
			}
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

	const hasActiveFilters = $derived(
		selectedTiers.length > 0 || selectedCategories.length > 0 || query !== ''
	);

	function toggle(list: string[], value: string): string[] {
		const i = list.indexOf(value);
		if (i === -1) return [...list, value];
		return list.filter((v) => v !== value);
	}

	function clearFilters() {
		selectedTiers = [];
		selectedCategories = [];
		query = '';
	}
</script>

<svelte:head>
	<title>Marmot Plugin Registry</title>
</svelte:head>

<div class="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
	<aside class="lg:sticky lg:top-20 lg:self-start">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-sm font-semibold text-gray-900 dark:text-white">Filters</h2>
			{#if hasActiveFilters}
				<button
					type="button"
					onclick={clearFilters}
					class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-earthy-terracotta-700 dark:hover:text-earthy-terracotta-400"
				>
					<X size={12} />
					Clear
				</button>
			{/if}
		</div>

		<div class="space-y-6">
			<div>
				<h3
					class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
				>
					Tier
				</h3>
				<div class="space-y-1.5">
					<label
						class="flex items-start gap-2 cursor-pointer group text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
					>
						<input
							type="checkbox"
							checked={selectedTiers.includes('official')}
							onchange={() => (selectedTiers = toggle(selectedTiers, 'official'))}
							class="mt-0.5 accent-earthy-terracotta-700 dark:accent-earthy-terracotta-400"
						/>
						<span>Official</span>
					</label>
					<label
						class="flex items-start gap-2 cursor-pointer group text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
					>
						<input
							type="checkbox"
							checked={selectedTiers.includes('community')}
							onchange={() => (selectedTiers = toggle(selectedTiers, 'community'))}
							class="mt-0.5 accent-earthy-terracotta-700 dark:accent-earthy-terracotta-400"
						/>
						<span>Community</span>
					</label>
				</div>
			</div>

			<div>
				<h3
					class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
				>
					Category
				</h3>
				<div class="space-y-1.5">
					{#each categories as cat (cat)}
						<label
							class="flex items-start gap-2 cursor-pointer group text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
						>
							<input
								type="checkbox"
								checked={selectedCategories.includes(cat)}
								onchange={() =>
									(selectedCategories = toggle(selectedCategories, cat))}
								class="mt-0.5 accent-earthy-terracotta-700 dark:accent-earthy-terracotta-400"
							/>
							<span>{cat}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>
	</aside>

	<div class="min-w-0">
		<div class="relative mb-4">
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

		<div class="mb-4 flex items-baseline justify-between gap-2 text-sm">
			<span class="text-gray-500 dark:text-gray-400">
				{filtered.length}
				{filtered.length === 1 ? 'plugin' : 'plugins'}
				{#if filtered.length !== data.plugins.length}
					<span class="text-gray-400 dark:text-gray-500">
						of {data.plugins.length}
					</span>
				{/if}
			</span>
		</div>

		{#if filtered.length === 0}
			<div class="py-12 text-center text-gray-500 dark:text-gray-400">
				No plugins match your filters.
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{#each filtered as plugin (plugin.namespace + '/' + plugin.name)}
					<PluginCard {plugin} />
				{/each}
			</div>
		{/if}
	</div>
</div>

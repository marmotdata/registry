<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, X, SlidersHorizontal, SearchX, BadgeCheck, Users, ArrowUpRight } from 'lucide-svelte';
	import PluginCard from '$lib/components/PluginCard.svelte';
	import SecretStoreCard from '$lib/components/SecretStoreCard.svelte';
	import { CATEGORIES, categoryInfo, categoryOf, sortFeatures } from '$lib/taxonomy';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Tier = 'official' | 'community';
	type Sort = 'name' | 'category';

	let query = $state('');
	let selectedTiers = $state<Tier[]>([]);
	let selectedCategories = $state<string[]>([]);
	let selectedFeatures = $state<string[]>([]);
	let sort = $state<Sort>('name');
	let filtersOpen = $state(false);
	let searchEl = $state<HTMLInputElement | null>(null);
	let narrow = $state(false);

	function tierOf(p: (typeof data.plugins)[number]): Tier {
		return p.official ? 'official' : 'community';
	}

	// ---- Facets with counts ------------------------------------------------
	function countBy<T extends string>(values: T[]): Map<T, number> {
		const m = new Map<T, number>();
		for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
		return m;
	}

	const categoryCounts = $derived(
		countBy(data.plugins.map((p) => categoryOf(p)?.id).filter((c): c is string => !!c))
	);
	// Curated order from taxonomy.ts; groups with nothing in them stay hidden.
	const categories = $derived(CATEGORIES.filter((c) => (categoryCounts.get(c.id) ?? 0) > 0));
	const featureCounts = $derived(countBy(data.plugins.flatMap((p) => p.features)));
	const features = $derived(sortFeatures([...featureCounts.keys()]));
	const tierCounts = $derived(countBy(data.plugins.map(tierOf)));

	// ---- Filtering -----------------------------------------------------------
	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const list = data.plugins.filter((p) => {
			const cat = categoryOf(p);
			if (selectedTiers.length > 0 && !selectedTiers.includes(tierOf(p))) return false;
			if (selectedCategories.length > 0 && (!cat || !selectedCategories.includes(cat.id)))
				return false;
			if (selectedFeatures.length > 0 && !selectedFeatures.every((f) => p.features.includes(f)))
				return false;
			if (!q) return true;
			const catLabel = cat ? cat.label.toLowerCase() : '';
			return (
				p.name.toLowerCase().includes(q) ||
				p.display_name.toLowerCase().includes(q) ||
				p.description.toLowerCase().includes(q) ||
				catLabel.includes(q) ||
				(p.category?.toLowerCase().includes(q) ?? false) ||
				p.features.some((f) => f.toLowerCase().includes(q))
			);
		});
		if (sort === 'category') {
			// Curated group order from taxonomy.ts, then by name inside a group.
			const rank = (p: (typeof list)[number]) => {
				const i = CATEGORIES.findIndex((c) => c.id === categoryOf(p)?.id);
				return i === -1 ? CATEGORIES.length : i;
			};
			return list.sort(
				(a, b) => rank(a) - rank(b) || a.display_name.localeCompare(b.display_name)
			);
		}
		return list.sort((a, b) => a.display_name.localeCompare(b.display_name));
	});

	const activeFilterCount = $derived(
		selectedTiers.length + selectedCategories.length + selectedFeatures.length
	);
	const hasActiveFilters = $derived(activeFilterCount > 0 || query.trim() !== '');

	function toggle<T>(list: T[], value: T): T[] {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	function clearAll() {
		selectedTiers = [];
		selectedCategories = [];
		selectedFeatures = [];
		query = '';
	}

	// ---- URL sync so filtered views are shareable ---------------------------
	let hydrated = false;
	onMount(() => {
		const mq = window.matchMedia('(max-width: 640px)');
		narrow = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (narrow = e.matches);
		mq.addEventListener('change', onChange);

		const sp = new URLSearchParams(window.location.search);
		query = sp.get('q') ?? '';
		selectedCategories = sp.getAll('category').filter((c) => CATEGORIES.some((k) => k.id === c));
		selectedFeatures = sp.getAll('feature');
		selectedTiers = sp.getAll('tier').filter((t): t is Tier => t === 'official' || t === 'community');
		const s = sp.get('sort');
		if (s === 'name' || s === 'category') sort = s;
		hydrated = true;

		return () => mq.removeEventListener('change', onChange);
	});

	$effect(() => {
		// Read every dependency so the effect re-runs on any change.
		const sp = new URLSearchParams();
		if (query.trim()) sp.set('q', query.trim());
		for (const c of selectedCategories) sp.append('category', c);
		for (const f of selectedFeatures) sp.append('feature', f);
		for (const t of selectedTiers) sp.append('tier', t);
		if (sort !== 'name') sp.set('sort', sort);
		if (!hydrated) return;
		const qs = sp.toString();
		const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
		if (next !== `${window.location.pathname}${window.location.search}`) {
			window.history.replaceState(window.history.state, '', next);
		}
	});

	// ---- Keyboard: "/" focuses search, Esc clears it --------------------------
	function onKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
		if (e.key === '/' && !typing) {
			e.preventDefault();
			searchEl?.focus();
		} else if (e.key === 'Escape' && target === searchEl) {
			query = '';
			searchEl?.blur();
		}
	}

	const officialCount = $derived(tierCounts.get('official') ?? 0);

	// Secret stores answer the search box but not the plugin facets. The section
	// hides when a facet is active so a filtered plugin list stays a plugin list.
	const matchingStores = $derived.by(() => {
		if (activeFilterCount > 0) return [];
		const q = query.trim().toLowerCase();
		if (!q) return data.secretStores;
		return data.secretStores.filter(
			(s) =>
				s.display_name.toLowerCase().includes(q) ||
				s.id.toLowerCase().includes(q) ||
				s.description.toLowerCase().includes(q) ||
				(s.federation?.toLowerCase().includes(q) ?? false) ||
				'secret store vault credentials'.includes(q)
		);
	});
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>Marmot Plugin Registry</title>
</svelte:head>

<!-- Hero ------------------------------------------------------------------ -->
<section class="relative mb-10 sm:mb-12">
	<div
		class="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-72 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(var(--c-accent)/0.10),transparent_70%)]"
		aria-hidden="true"
	></div>
	<div class="mx-auto max-w-3xl text-center">
		<p class="eyebrow mb-3 text-accent">Marmot Plugin Registry</p>
		<h1 class="text-balance text-4xl font-bold tracking-tightest text-ink sm:text-5xl">
			Plugins for every corner of your data stack
		</h1>
		<p class="mx-auto mt-4 max-w-xl text-balance text-lg leading-relaxed text-ink-muted">
			Connect Marmot to {data.pluginCount} sources. Each plugin discovers assets, captures
			lineage, and keeps your catalog current.
		</p>

		<div class="relative mx-auto mt-7 max-w-2xl">
			<Search
				size={18}
				class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
			/>
			<input
				bind:this={searchEl}
				type="search"
				placeholder={narrow ? 'Search plugins…' : 'Search by name, category, or capability…'}
				bind:value={query}
				aria-label="Search plugins"
				autocomplete="off"
				spellcheck="false"
				class="w-full rounded-2xl border border-line bg-surface py-4 pl-12 pr-24 text-base text-ink shadow-card placeholder:text-ink-subtle transition-[box-shadow,border-color] focus:border-accent/60 focus:outline-none focus:ring-4 focus:ring-accent/10 [&::-webkit-search-cancel-button]:hidden"
			/>
			<div class="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
				{#if query}
					<button
						type="button"
						onclick={() => (query = '')}
						class="icon-btn pointer-events-auto"
						aria-label="Clear search"
					>
						<X size={15} />
					</button>
				{:else}
					<kbd
						class="hidden h-7 min-w-7 items-center justify-center rounded-md border border-line bg-surface-2 px-2 text-xs font-medium text-ink-subtle sm:inline-flex"
						title="Press / to search"
					>
						/
					</kbd>
				{/if}
			</div>
		</div>

		<dl class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
			<div class="flex items-baseline gap-1.5">
				<dd class="m-0 font-semibold text-ink">{data.pluginCount}</dd>
				<dt>plugins</dt>
			</div>
			<div class="flex items-baseline gap-1.5">
				<dd class="m-0 font-semibold text-ink">{categories.length}</dd>
				<dt>categories</dt>
			</div>
			<div class="flex items-baseline gap-1.5">
				<dd class="m-0 font-semibold text-ink">{officialCount}</dd>
				<dt>maintained by Marmot</dt>
			</div>
			<a
				href="#secret-stores"
				class="flex items-baseline gap-1.5 rounded transition-colors hover:text-accent"
				title="Jump to secret stores"
			>
				<dd class="m-0 font-semibold text-ink">{data.secretStores.length}</dd>
				<dt>secret stores</dt>
			</a>
		</dl>
	</div>
</section>

<!-- Browse ---------------------------------------------------------------- -->
<div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
	<!-- Mobile filter toggle -->
	<div class="flex items-center justify-between lg:hidden">
		<button
			type="button"
			onclick={() => (filtersOpen = !filtersOpen)}
			class="btn-secondary"
			aria-expanded={filtersOpen}
			aria-controls="filters"
		>
			<SlidersHorizontal size={15} />
			Filters
			{#if activeFilterCount > 0}
				<span class="rounded-full bg-accent px-2 text-xs font-semibold text-white">{activeFilterCount}</span>
			{/if}
		</button>
		{#if hasActiveFilters}
			<button type="button" onclick={clearAll} class="btn-ghost text-xs">Clear all</button>
		{/if}
	</div>

	<aside
		id="filters"
		class="{filtersOpen ? 'block' : 'hidden'} lg:sticky lg:top-20 lg:block lg:self-start"
	>
		<div class="mb-4 flex h-7 items-center justify-between">
			<h2 class="m-0 text-base font-semibold text-ink">Filters</h2>
			{#if activeFilterCount > 0}
				<button
					type="button"
					onclick={() => {
						selectedTiers = [];
						selectedCategories = [];
						selectedFeatures = [];
					}}
					class="inline-flex items-center gap-1 text-xs font-medium text-ink-subtle hover:text-accent"
				>
					<X size={12} />
					Reset
				</button>
			{/if}
		</div>

		<div class="space-y-7">
			<section>
				<h3 class="eyebrow mb-2">Category</h3>
				<ul class="m-0 -mx-2 list-none space-y-px p-0">
					{#each categories as cat (cat.id)}
						{@const active = selectedCategories.includes(cat.id)}
						<li>
							<button
								type="button"
								onclick={() => (selectedCategories = toggle(selectedCategories, cat.id))}
								aria-pressed={active}
								title={cat.description}
								class="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors {active
									? 'bg-accent-soft font-medium text-accent-ink'
									: 'text-ink-muted hover:bg-surface-3 hover:text-ink'}"
							>
								<cat.icon
									size={15}
									strokeWidth={2}
									class="flex-shrink-0 {active ? 'text-accent' : 'text-ink-subtle group-hover:text-ink-muted'}"
								/>
								<span class="min-w-0 flex-1 truncate">{cat.label}</span>
								<span
									class="text-xs tabular-nums {active ? 'text-accent-ink/70' : 'text-ink-subtle'}"
								>
									{categoryCounts.get(cat.id)}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<h3 class="eyebrow mb-2">Capabilities</h3>
				<ul class="m-0 -mx-2 list-none space-y-px p-0">
					{#each features as f (f.name)}
						{@const active = selectedFeatures.includes(f.name)}
						<li>
							<button
								type="button"
								onclick={() => (selectedFeatures = toggle(selectedFeatures, f.name))}
								aria-pressed={active}
								title={f.description}
								class="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors {active
									? 'bg-accent-soft font-medium text-accent-ink'
									: 'text-ink-muted hover:bg-surface-3 hover:text-ink'}"
							>
								<f.icon
									size={15}
									strokeWidth={2}
									class="flex-shrink-0 {active ? 'text-accent' : 'text-ink-subtle group-hover:text-ink-muted'}"
								/>
								<span class="min-w-0 flex-1 truncate">{f.name}</span>
								<span
									class="text-xs tabular-nums {active ? 'text-accent-ink/70' : 'text-ink-subtle'}"
								>
									{featureCounts.get(f.name)}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<h3 class="eyebrow mb-2">Maintainer</h3>
				<ul class="m-0 -mx-2 list-none space-y-px p-0">
					{#each [{ id: 'official' as Tier, label: 'Official', icon: BadgeCheck, hint: 'Built and supported by the Marmot team' }, { id: 'community' as Tier, label: 'Community', icon: Users, hint: 'Contributed by the community' }] as tier (tier.id)}
						{@const active = selectedTiers.includes(tier.id)}
						{@const count = tierCounts.get(tier.id) ?? 0}
						<li>
							<button
								type="button"
								onclick={() => (selectedTiers = toggle(selectedTiers, tier.id))}
								aria-pressed={active}
								title={tier.hint}
								disabled={count === 0}
								class="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 {active
									? 'bg-accent-soft font-medium text-accent-ink'
									: 'text-ink-muted enabled:hover:bg-surface-3 enabled:hover:text-ink'}"
							>
								<tier.icon
									size={15}
									strokeWidth={2}
									class="flex-shrink-0 {active ? 'text-accent' : 'text-ink-subtle group-hover:text-ink-muted'}"
								/>
								<span class="min-w-0 flex-1 truncate">{tier.label}</span>
								<span
									class="text-xs tabular-nums {active ? 'text-accent-ink/70' : 'text-ink-subtle'}"
								>
									{count}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<section class="rounded-xl border border-dashed border-line-strong p-3.5">
				<p class="m-0 text-sm font-semibold text-ink">Missing an integration?</p>
				<p class="mb-3 mt-1 text-sm leading-relaxed text-ink-muted">
					Plugins are small Go programs built with the SDK.
				</p>
				<a
					href="https://marmotdata.io/docs/Develop/creating-plugins"
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
				>
					Build your own
					<ArrowUpRight size={13} />
				</a>
			</section>
		</div>
	</aside>

	<div class="min-w-0">
		<!-- Toolbar -->
		<div class="mb-4 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2">
			<p class="m-0 text-sm text-ink-muted" aria-live="polite">
				<span class="font-semibold text-ink">{filtered.length}</span>
				{filtered.length === 1 ? 'plugin' : 'plugins'}
				{#if filtered.length !== data.plugins.length}
					<span class="text-ink-subtle">of {data.plugins.length}</span>
				{/if}
			</p>

			{#if activeFilterCount > 0}
				<div class="flex flex-wrap items-center gap-1.5">
					{#each selectedCategories as c (c)}
						{@const info = categoryInfo(c)}
						<button
							type="button"
							onclick={() => (selectedCategories = toggle(selectedCategories, c))}
							class="inline-flex h-7 items-center gap-1 rounded-md border border-earthy-terracotta-200 bg-accent-soft pl-2.5 pr-1.5 text-xs font-medium text-accent-ink transition-colors hover:border-accent/50 dark:border-earthy-terracotta-800/50"
							aria-label="Remove filter {info.label}"
						>
							{info.label}
							<X size={12} class="opacity-60" />
						</button>
					{/each}
					{#each selectedFeatures as f (f)}
						<button
							type="button"
							onclick={() => (selectedFeatures = toggle(selectedFeatures, f))}
							class="inline-flex h-7 items-center gap-1 rounded-md border border-earthy-terracotta-200 bg-accent-soft pl-2.5 pr-1.5 text-xs font-medium text-accent-ink transition-colors hover:border-accent/50 dark:border-earthy-terracotta-800/50"
							aria-label="Remove filter {f}"
						>
							{f}
							<X size={12} class="opacity-60" />
						</button>
					{/each}
					{#each selectedTiers as t (t)}
						<button
							type="button"
							onclick={() => (selectedTiers = toggle(selectedTiers, t))}
							class="inline-flex h-7 items-center gap-1 rounded-md border border-earthy-terracotta-200 bg-accent-soft pl-2.5 pr-1.5 text-xs font-medium capitalize text-accent-ink transition-colors hover:border-accent/50 dark:border-earthy-terracotta-800/50"
							aria-label="Remove filter {t}"
						>
							{t}
							<X size={12} class="opacity-60" />
						</button>
					{/each}
				</div>
			{/if}

			<label class="ml-auto flex items-center gap-2 text-sm text-ink-subtle">
				Sort
				<select
					bind:value={sort}
					class="h-9 cursor-pointer rounded-lg border border-line bg-surface pl-3 pr-8 text-sm font-medium text-ink transition-colors hover:border-line-strong focus:border-accent/60 focus:outline-none"
				>
					<option value="name">Name</option>
					<option value="category">Category</option>
				</select>
			</label>
		</div>

		{#if filtered.length === 0 && matchingStores.length === 0}
			<div class="card flex flex-col items-center px-6 py-16 text-center">
				<div class="logo-well mb-4 h-14 w-14">
					<SearchX size={24} class="text-ink-subtle" />
				</div>
				<h3 class="m-0 text-base font-semibold text-ink">No plugins match</h3>
				<p class="mx-auto mt-1.5 max-w-sm text-sm text-ink-muted">
					Try a different search term or remove a filter. Missing something? Every plugin starts
					as a small Go program.
				</p>
				<div class="mt-5 flex flex-wrap items-center justify-center gap-2">
					<button type="button" onclick={clearAll} class="btn-secondary">Clear filters</button>
					<a
						href="https://marmotdata.io/docs/Develop/creating-plugins"
						target="_blank"
						rel="noopener"
						class="btn-ghost"
					>
						Build a plugin
						<ArrowUpRight size={14} />
					</a>
				</div>
			</div>
		{:else if filtered.length > 0}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each filtered as plugin (plugin.namespace + '/' + plugin.name)}
					<PluginCard {plugin} />
				{/each}
			</div>
		{/if}

		{#if matchingStores.length > 0}
			<section
				id="secret-stores"
				class="mt-12 scroll-mt-24 border-t border-line pt-10"
				aria-labelledby="secret-stores-heading"
			>
				<div class="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
					<div class="max-w-2xl">
						<p class="eyebrow mb-1.5 text-accent">Marmot Cloud</p>
						<h2 id="secret-stores-heading" class="m-0 text-2xl font-bold tracking-tight text-ink">
							Secret stores
						</h2>
						<p class="m-0 mt-1.5 text-base leading-relaxed text-ink-muted text-pretty">
							Keep credentials in the secret manager you already run. Marmot stores the address of a
							secret, reads the value just before a pipeline runs, and never keeps it. Available on every
							Marmot Cloud plan.
						</p>
					</div>
					<a
						href="https://marmotdata.io/pricing"
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
					>
						About Marmot Cloud
						<ArrowUpRight size={14} />
					</a>
				</div>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each matchingStores as store (store.id)}
						<SecretStoreCard {store} />
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

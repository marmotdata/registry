<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { MmFilterChangeDetail } from '@marmotdata/elements/classes/facet-sidebar.js';
	import PluginCard from '$lib/components/PluginCard.svelte';
	import SecretStoreCard from '$lib/components/SecretStoreCard.svelte';
	import { setProps } from '$lib/props';
	import { CATEGORIES, categoryInfo, categoryOf, sortFeatures } from '$lib/taxonomy';
	import { SITE_URL } from '$lib/site';
	import type { Plugin } from '$lib/types';
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

	function tierOf(p: Plugin): Tier {
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

	const categoryOptions = $derived(
		categories.map((c) => ({ value: c.id, label: c.label, icon: c.icon, count: categoryCounts.get(c.id) }))
	);
	const featureOptions = $derived(
		features.map((f) => ({ value: f.name, label: f.name, icon: f.icon, count: featureCounts.get(f.name) }))
	);
	const tierOptions = $derived(
		[
			{ value: 'official', label: 'Marmot', icon: 'verified', count: tierCounts.get('official') },
			{ value: 'community', label: 'Community', icon: 'groups', count: tierCounts.get('community') }
		].filter((o) => (o.count ?? 0) > 0)
	);

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
			const rank = (p: Plugin) => {
				const i = CATEGORIES.findIndex((c) => c.id === categoryOf(p)?.id);
				return i === -1 ? CATEGORIES.length : i;
			};
			return list.sort((a, b) => rank(a) - rank(b) || a.display_name.localeCompare(b.display_name));
		}
		return list.sort((a, b) => a.display_name.localeCompare(b.display_name));
	});

	const activeFilterCount = $derived(
		selectedTiers.length + selectedCategories.length + selectedFeatures.length
	);

	function toggle<T>(list: T[], value: T): T[] {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	function onFilterChange(e: CustomEvent<MmFilterChangeDetail>) {
		const f = e.detail.facets;
		selectedCategories = f.category ?? [];
		selectedFeatures = f.capability ?? [];
		selectedTiers = (f.maintainer ?? []) as Tier[];
	}

	async function clearAll() {
		selectedTiers = [];
		selectedCategories = [];
		selectedFeatures = [];
		query = '';
		await tick();
		(document.querySelector('mm-search-field') as HTMLElement | null)?.focus();
	}

	// ---- URL sync so filtered views are shareable ---------------------------
	let hydrated = false;
	onMount(() => {
		const sp = new URLSearchParams(window.location.search);
		query = sp.get('q') ?? '';
		selectedCategories = sp.getAll('category').filter((c) => CATEGORIES.some((k) => k.id === c));
		selectedFeatures = sp.getAll('feature');
		selectedTiers = sp.getAll('tier').filter((t): t is Tier => t === 'official' || t === 'community');
		const s = sp.get('sort');
		if (s === 'name' || s === 'category') sort = s;
		hydrated = true;
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
<svelte:head>
	<title>Marmot Plugin Registry</title>
	<meta property="og:title" content="Marmot Plugin Registry" />
	<meta
		property="og:description"
		content="Plugins that connect Marmot, the open-source data catalog, to the tools you already run."
	/>
	<meta property="og:url" content={SITE_URL} />
</svelte:head>

<!-- Hero ------------------------------------------------------------------ -->
<section class="hero mm-topography mm-topography--fade-edges" aria-labelledby="hero-title">
	<h1 id="hero-title" class="mm-display-hero">Plugins for every corner of your data stack</h1>
	<p class="lead">Connect Marmot to the tools you already run.</p>

	<mm-search-field
		class="search"
		label="Search plugins"
		hide-label
		placeholder="Search by name, category or capability"
		shortcut="/"
		global-shortcut
		value={query}
		oninput={(e: Event) => (query = (e.currentTarget as HTMLInputElement).value)}
	></mm-search-field>

</section>

<!-- Browse ---------------------------------------------------------------- -->
<div class="browse">
	<div class="filters-toggle">
		<mm-button
			icon="filter-list"
			expanded={filtersOpen ? 'true' : 'false'}
			controls="filters"
			onclick={() => (filtersOpen = !filtersOpen)}
		>
			Filters
			{#if activeFilterCount > 0}<mm-count value={activeFilterCount} label="applied"></mm-count>{/if}
		</mm-button>
	</div>

	<!-- Applied filters show once, as pills in the results toolbar. -->
	<mm-facet-sidebar id="filters" class="filters" class:open={filtersOpen} hide-applied onmm-filter-change={onFilterChange}>
		<mm-facet
			name="category"
			label="Category"
			limit={12}
			use:setProps={{ options: categoryOptions, value: selectedCategories }}
		></mm-facet>
		<mm-facet
			name="capability"
			label="Capabilities"
			use:setProps={{ options: featureOptions, value: selectedFeatures }}
		></mm-facet>
		<mm-facet
			name="maintainer"
			label="Maintainer"
			use:setProps={{ options: tierOptions, value: selectedTiers }}
		></mm-facet>
		<div slot="footer" class="build-own">
			<p class="mm-heading-sm">Missing an integration?</p>
			<p class="mm-caption">Plugins are small Go programs built with the SDK.</p>
			<mm-link href="https://marmotdata.io/docs/Develop/creating-plugins" external>Build your own</mm-link>
		</div>
	</mm-facet-sidebar>

	<div class="results">
		<!-- Toolbar -->
		<div class="toolbar">
			<p class="count mm-dense" aria-live="polite">
				<span class="mm-num">{filtered.length}</span>
				{filtered.length === 1 ? 'plugin' : 'plugins'}
			</p>

			{#if activeFilterCount > 0}
				<div class="applied" aria-label="Applied filters" role="group">
					{#each selectedCategories as c (c)}
						<mm-filter-pill removable onmm-remove={() => (selectedCategories = toggle(selectedCategories, c))}
							>{categoryInfo(c).label}</mm-filter-pill
						>
					{/each}
					{#each selectedFeatures as f (f)}
						<mm-filter-pill removable onmm-remove={() => (selectedFeatures = toggle(selectedFeatures, f))}
							>{f}</mm-filter-pill
						>
					{/each}
					{#each selectedTiers as t (t)}
						<mm-filter-pill removable onmm-remove={() => (selectedTiers = toggle(selectedTiers, t))}
							>{t === 'official' ? 'Marmot' : 'Community'}</mm-filter-pill
						>
					{/each}
				</div>
			{/if}

			<mm-select
				class="sort"
				label="Sort by"
				hide-label
				value={sort}
				onchange={(e: Event) => (sort = (e.currentTarget as HTMLInputElement).value as Sort)}
			>
				<mm-option value="name">Sort by name</mm-option>
				<mm-option value="category">Sort by category</mm-option>
			</mm-select>
		</div>

		{#if filtered.length === 0 && matchingStores.length === 0}
			<mm-empty-state heading="No plugins match" description="Try a different search term, or clear the filters to see every plugin.">
				<mm-button slot="action" variant="primary" onclick={clearAll}>Clear search and filters</mm-button>
			</mm-empty-state>
		{:else if filtered.length > 0}
			<div class="grid">
				{#each filtered as plugin (plugin.namespace + '/' + plugin.name)}
					<PluginCard {plugin} />
				{/each}
			</div>
		{/if}

		{#if matchingStores.length > 0}
			<section id="secret-stores" class="stores" aria-labelledby="secret-stores-heading">
				<div class="stores-head">
					<div>
						<p class="mm-label">Marmot Cloud</p>
						<h2 id="secret-stores-heading" class="mm-display-section">Secret stores</h2>
						<p class="stores-lead">
							Keep credentials in the secret manager you already run. Marmot reads each secret just before a
							pipeline runs and never stores it.
						</p>
					</div>
					<mm-link href="https://marmotdata.io/pricing" external>About Marmot Cloud</mm-link>
				</div>
				<div class="grid grid--two">
					{#each matchingStores as store (store.id)}
						<SecretStoreCard {store} />
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

<style>
	.hero {
		display: grid;
		justify-items: center;
		gap: var(--space-4);
		margin-inline: calc(-1 * var(--space-8));
		margin-block: calc(-1 * var(--space-8)) var(--space-8);
		padding: var(--space-12) var(--space-8);
		text-align: center;
	}
	.hero > * {
		margin: 0;
	}
	.hero h1 {
		max-inline-size: 18ch;
		text-wrap: balance;
	}
	.lead {
		max-inline-size: 56ch;
		font: var(--text-body);
		color: var(--mm-text-2);
		text-wrap: balance;
	}
	.search {
		inline-size: min(100%, 40rem);
		margin-block-start: var(--space-4);
		text-align: start;
	}

	.browse {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: var(--space-8);
		align-items: start;
	}
	.filters-toggle {
		display: none;
	}
	.filters {
		position: sticky;
		inset-block-start: calc(var(--mm-control) + var(--space-8));
	}
	.build-own {
		display: grid;
		gap: var(--space-1);
		justify-items: start;
	}
	.build-own p {
		margin: 0;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
		margin-block-end: var(--space-4);
	}
	.count {
		margin: 0;
		color: var(--mm-text-2);
	}
	.count .mm-num {
		font-weight: 600;
		color: var(--mm-text);
	}
	.applied {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	.sort {
		inline-size: 11rem;
		margin-inline-start: auto;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-4);
	}
	.grid--two {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.stores {
		margin-block-start: var(--space-12);
		padding-block-start: var(--space-8);
		border-block-start: 1px solid var(--mm-rule);
	}
	.stores-head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-3) var(--space-6);
		margin-block-end: var(--space-5);
	}
	.stores-head p,
	.stores-head h2 {
		margin: 0;
	}
	.stores-head h2 {
		margin-block: var(--space-1);
	}
	.stores-lead {
		max-inline-size: 64ch;
		font: var(--text-body);
		color: var(--mm-text-2);
	}

	@media (max-width: 1280px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 960px) {
		.browse {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-4);
		}
		.filters-toggle {
			display: block;
		}
		.filters {
			display: none;
			position: static;
		}
		.filters.open {
			display: block;
		}
	}
	@media (max-width: 720px) {
		.hero {
			margin-inline: calc(-1 * var(--space-4));
			margin-block-start: calc(-1 * var(--space-6));
			padding: var(--space-8) var(--space-4);
		}
		.hero h1 {
			font: var(--text-display-title);
			letter-spacing: var(--tracking-display-title);
		}
		.grid,
		.grid--two {
			grid-template-columns: minmax(0, 1fr);
		}
		.sort {
			margin-inline-start: 0;
		}
	}
</style>

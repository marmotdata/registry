<!-- The tag row shown on cards and the detail header: category, features, status. -->
<script lang="ts">
	import type { Plugin } from '$lib/types';
	import CategoryTag from './CategoryTag.svelte';
	import FeatureTag from './FeatureTag.svelte';
	import StatusTag from './StatusTag.svelte';
	import { categoryOf, sortFeatures } from '$lib/taxonomy';

	interface Props {
		plugin: Plugin;
		size?: 'sm' | 'md';
		showStatus?: boolean;
		/** Capabilities to leave out, e.g. ['Assets'] on cards where nearly every plugin has it. */
		omit?: string[];
	}
	let { plugin, size = 'sm', showStatus = true, omit = [] }: Props = $props();
	let features = $derived(sortFeatures(plugin.features.filter((f) => !omit.includes(f))));
	let category = $derived(categoryOf(plugin));
</script>

<div class="flex flex-wrap items-center gap-1.5">
	{#if category}
		<CategoryTag id={category.id} {size} />
	{/if}
	{#each features as f (f.name)}
		<FeatureTag name={f.name} {size} />
	{/each}
	{#if showStatus && plugin.status}
		<StatusTag slug={plugin.status} {size} />
	{/if}
</div>

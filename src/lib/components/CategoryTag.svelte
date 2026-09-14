<script lang="ts">
	import Tag from './Tag.svelte';
	import { categoryInfo } from '$lib/taxonomy';

	interface Props {
		/** Category group id, see CATEGORIES in taxonomy.ts. */
		id: string;
		size?: 'sm' | 'md';
	}
	let { id, size = 'sm' }: Props = $props();
	let info = $derived(categoryInfo(id));
</script>

<Tag tone="neutral" {size} title={info.label}>
	{#snippet icon()}<info.icon strokeWidth={2} />{/snippet}
	{info.label}
</Tag>

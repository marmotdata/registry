<script lang="ts">
	import Tag from './Tag.svelte';
	import { featureInfo } from '$lib/taxonomy';

	interface Props {
		name: string;
		size?: 'sm' | 'md';
	}
	let { name, size = 'sm' }: Props = $props();
	let info = $derived(featureInfo(name));
</script>

<Tag tone="neutral" {size} title={info.description || info.name}>
	{#snippet icon()}<info.icon strokeWidth={2} />{/snippet}
	{info.name}
</Tag>

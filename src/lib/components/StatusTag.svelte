<script lang="ts">
	import Tag from './Tag.svelte';
	import { statusInfo } from '$lib/taxonomy';

	interface Props {
		slug: string;
		size?: 'sm' | 'md';
	}
	let { slug, size = 'sm' }: Props = $props();
	let info = $derived(statusInfo(slug));
</script>

<Tag tone={info.tone} {size} dot title={info.description || info.label}>
	{info.label}
</Tag>

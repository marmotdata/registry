<script lang="ts">
	import Icon from '@iconify/svelte';
	import { base } from '$app/paths';
	import { iconSpec } from '$lib/icons';

	interface Props {
		iconName: string;
		alt: string;
		size?: number;
	}

	let { iconName, alt, size = 32 }: Props = $props();
	let spec = $derived(iconSpec(iconName));
</script>

{#if spec.local}
	{@const ext = spec.ext ?? 'svg'}
	{@const light = `${base}/img/${spec.local}.${ext}`}
	{@const dark = spec.hasDark ? `${base}/img/dark-${spec.local}.${ext}` : light}
	<img
		src={light}
		alt={`${alt} icon`}
		width={size}
		height={size}
		class="block dark:hidden"
	/>
	<img
		src={dark}
		alt={`${alt} icon`}
		width={size}
		height={size}
		class="hidden dark:block"
	/>
{:else if spec.iconify}
	<Icon icon={spec.iconify} width={size} height={size} />
{/if}

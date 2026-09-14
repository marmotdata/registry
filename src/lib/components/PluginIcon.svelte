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
	// Wide marks may use up to 1.5× the height; anything wider is scaled down.
	let maxWidth = $derived(Math.round(size * 1.5));
</script>

{#if spec.local}
	{@const ext = spec.ext ?? 'svg'}
	{@const light = `${base}/img/${spec.local}.${ext}`}
	{@const dark = spec.hasDark ? `${base}/img/dark-${spec.local}.${ext}` : light}
	<!-- Height only, so a wide mark keeps its own proportions like Iconify ones. -->
	<img src={light} alt={`${alt} icon`} height={size} style="height:{size}px;width:auto;max-width:{maxWidth}px" class="block object-contain dark:hidden" />
	<img src={dark} alt={`${alt} icon`} height={size} style="height:{size}px;width:auto;max-width:{maxWidth}px" class="hidden object-contain dark:block" />
{:else if spec.iconify}
	<!-- Height is fixed and width follows the mark's own aspect ratio, so wide
	     marks are not shrunk to fit a square. Tinted marks read the brand colour
	     from CSS variables so the dark theme can swap it. -->
	<span
		class="inline-flex items-center justify-center [&>svg]:max-w-full {spec.color
			? 'text-[color:var(--icon)] dark:text-[color:var(--icon-dark)]'
			: ''}"
		style="max-width:{maxWidth}px;{spec.color ? `--icon:${spec.color};--icon-dark:${spec.darkColor ?? spec.color}` : ''}"
	>
		<Icon icon={spec.iconify} height={Math.round(size * (spec.scale ?? 1))} width="auto" />
	</span>
{/if}

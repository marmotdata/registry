<!--
  A plugin's or secret store's mark. Decorative: every place that shows one prints the name beside it.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { iconSpec } from '$lib/icons';

	interface Props {
		iconName: string;
		/** Pixel size of the square the mark sits in. */
		size?: number;
	}

	let { iconName, size = 24 }: Props = $props();
	let spec = $derived(iconSpec(iconName));
</script>

<span class="mark" style:--mark-size="{size}px">
	{#if 'provider' in spec}
		<mm-provider-logo provider={spec.provider} {size} decorative></mm-provider-logo>
	{:else}
		{@const light = `${base}/img/${spec.local}.${spec.ext}`}
		<img class="light" src={light} alt="" />
		<img class="dark" src={spec.hasDark ? `${base}/img/dark-${spec.local}.${spec.ext}` : light} alt="" />
	{/if}
</span>

<style>
	.mark {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		inline-size: var(--mark-size);
		block-size: var(--mark-size);
	}
	img {
		max-inline-size: 100%;
		max-block-size: 100%;
		object-fit: contain;
	}
	.dark {
		display: none;
	}
	:global([data-theme='dark']) .light {
		display: none;
	}
	:global([data-theme='dark']) .dark {
		display: block;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .light {
			display: none;
		}
		:global(:root:not([data-theme='light'])) .dark {
			display: block;
		}
	}
</style>

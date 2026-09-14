<!-- Listing card for a Marmot Cloud secret store. Not a link: stores have no
     registry page yet, they ship inside the Cloud server image. -->
<script lang="ts">
	import { Cloud, KeyRound } from 'lucide-svelte';
	import type { SecretStore } from '$lib/types';
	import PluginIcon from './PluginIcon.svelte';
	import Tag from './Tag.svelte';
	import StatusTag from './StatusTag.svelte';

	interface Props {
		store: SecretStore;
	}
	let { store }: Props = $props();
</script>

<article class="card flex h-full flex-col p-5">
	<div class="flex items-start gap-3.5">
		<div class="logo-well h-12 w-12">
			<PluginIcon iconName={store.icon} alt={store.display_name} size={28} />
		</div>
		<div class="min-w-0 flex-1 pt-0.5">
			<h3 class="m-0 truncate text-base font-semibold text-ink">
				{store.display_name}
			</h3>
			<p class="mt-0.5 truncate font-mono text-xs text-ink-subtle">
				marmot_secret_store_{store.id}
			</p>
		</div>
	</div>

	<p class="mt-3 line-clamp-3 text-sm text-ink-muted text-pretty">
		{store.description}
	</p>

	<div class="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
		<Tag tone="accent" title="Available on Marmot Cloud">
			{#snippet icon()}<Cloud strokeWidth={2} />{/snippet}
			Cloud
		</Tag>
		{#if store.federation}
			<Tag title="How the store authenticates with a Marmot-issued identity">
				{#snippet icon()}<KeyRound strokeWidth={2} />{/snippet}
				{store.federation}
			</Tag>
		{/if}
		{#if store.status}
			<StatusTag slug={store.status} />
		{/if}
	</div>
</article>

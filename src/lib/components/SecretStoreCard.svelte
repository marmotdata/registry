<!-- Listing card for a Marmot Cloud secret store. Not a link: stores have no
     registry page yet, they ship inside the Cloud server image. -->
<script lang="ts">
	import type { SecretStore } from '$lib/types';
	import { statusInfo } from '$lib/taxonomy';
	import PluginIcon from './PluginIcon.svelte';

	interface Props {
		store: SecretStore;
	}
	let { store }: Props = $props();
	let status = $derived(store.status ? statusInfo(store.status) : null);
</script>

<article class="mm-panel card">
	<div class="head">
		<PluginIcon iconName={store.icon} size={32} />
		<div class="title">
			<h3 class="name">{store.display_name}</h3>
			<p class="id mm-mono">marmot_secret_store_{store.id}</p>
		</div>
	</div>

	<p class="description">{store.description}</p>

	<div class="tags">
		{#if store.federation}
			<span class="mm-tag"><mm-icon name="key" size={14}></mm-icon>{store.federation}</span>
		{/if}
		{#if status?.attention}
			<mm-status-pill status={status.tone} icon={status.icon}>{status.label}</mm-status-pill>
		{/if}
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		block-size: 100%;
		box-sizing: border-box;
		padding: var(--space-5);
	}
	.head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.title {
		min-inline-size: 0;
	}
	.name {
		margin: 0;
		font: var(--text-panel-title);
		letter-spacing: var(--tracking-panel-title);
	}
	.id {
		margin: 0;
		color: var(--mm-text-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.description {
		margin: 0;
		font: var(--text-dense);
		color: var(--mm-text-2);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-block-start: auto;
	}
</style>

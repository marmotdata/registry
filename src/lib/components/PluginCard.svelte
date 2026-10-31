<script lang="ts">
	import { base } from '$app/paths';
	import type { Plugin } from '$lib/types';
	import { categoryOf, sortFeatures, statusInfo } from '$lib/taxonomy';
	import PluginIcon from './PluginIcon.svelte';

	interface Props {
		plugin: Plugin;
	}

	let { plugin }: Props = $props();
	let category = $derived(categoryOf(plugin));
	// Nearly every plugin emits assets, so the card leaves that capability out.
	let features = $derived(sortFeatures(plugin.features.filter((f) => f !== 'Assets')));
	let status = $derived(plugin.status ? statusInfo(plugin.status) : null);
</script>

<a href="{base}/{plugin.namespace}/{plugin.name}" class="card">
	<div class="head">
		<PluginIcon iconName={plugin.icon} size={32} />
		<div class="title">
			<h3 class="name">
				{plugin.display_name}
				{#if plugin.official}
					<mm-icon name="verified" size={16} label="Maintained by Marmot"></mm-icon>
				{/if}
			</h3>
			<p class="id">
				<span class="mm-mono">{plugin.namespace}/{plugin.name}</span>
				{#if plugin.latest_version}<span aria-hidden="true">·</span>
					<span>Version {plugin.latest_version}</span>{/if}
			</p>
		</div>
	</div>

	<p class="description">{plugin.description}</p>

	<div class="tags">
		{#if category}<span class="mm-tag"><mm-icon name={category.icon} size={14}></mm-icon>{category.label}</span>{/if}
		{#each features as f (f.name)}
			<span class="mm-tag"><mm-icon name={f.icon} size={14}></mm-icon>{f.name}</span>
		{/each}
		{#if status?.attention}
			<mm-status-pill status={status.tone} icon={status.icon}>{status.label}</mm-status-pill>
		{/if}
	</div>
</a>

<style>
	/* A card is the whole link. Hover darkens the border; cards never lift. */
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		block-size: 100%;
		box-sizing: border-box;
		padding: var(--space-5);
		background: var(--mm-surface);
		border: 1px solid var(--mm-rule);
		border-radius: var(--radius-md);
		color: var(--mm-text);
		text-decoration: none;
		transition: border-color var(--mm-dur-press) var(--mm-ease);
	}
	.card:hover {
		border-color: var(--mm-control-border);
	}
	.card:hover .name {
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-thickness: 1px;
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
		display: flex;
		align-items: center;
		gap: var(--space-1);
		margin: 0;
		font: var(--text-panel-title);
		letter-spacing: var(--tracking-panel-title);
	}
	.name mm-icon {
		color: var(--mm-text-2);
	}
	.id {
		display: flex;
		gap: var(--space-1);
		margin: 0;
		font: var(--text-caption);
		color: var(--mm-text-2);
		white-space: nowrap;
		overflow: hidden;
	}
	.id .mm-mono {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.description {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: 0;
		min-block-size: calc(2 * 1.45em);
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

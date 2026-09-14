<script lang="ts">
	import { base } from '$app/paths';
	import { ArrowUpRight } from 'lucide-svelte';
	import type { Plugin } from '$lib/types';
	import PluginIcon from './PluginIcon.svelte';
	import OfficialBadge from './OfficialBadge.svelte';
	import PluginTags from './PluginTags.svelte';

	interface Props {
		plugin: Plugin;
	}

	let { plugin }: Props = $props();
</script>

<a
	href="{base}/{plugin.namespace}/{plugin.name}"
	class="card-link group relative flex h-full flex-col p-5 no-underline"
	aria-label="{plugin.display_name} plugin"
>
	<div class="flex items-start gap-3.5">
		<div class="logo-well h-12 w-12 transition-colors group-hover:border-accent/40">
			<PluginIcon iconName={plugin.icon} alt={plugin.display_name} size={28} />
		</div>
		<div class="min-w-0 flex-1 pt-0.5">
			<div class="flex items-center gap-1.5">
				<h3
					class="m-0 truncate text-base font-semibold text-ink transition-colors group-hover:text-accent"
				>
					{plugin.display_name}
				</h3>
				{#if plugin.official}
					<OfficialBadge size={15} />
				{/if}
			</div>
			<p class="mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-xs text-ink-subtle">
				<span class="truncate">{plugin.namespace}/{plugin.name}</span>
				{#if plugin.latest_version}
					<span class="flex-shrink-0 opacity-50" aria-hidden="true">·</span>
					<span class="flex-shrink-0" title="Latest version">v{plugin.latest_version}</span>
				{/if}
			</p>
		</div>
	</div>

	<p class="mt-3 min-h-12 line-clamp-2 text-sm text-ink-muted text-pretty">
		{plugin.description}
	</p>

	<div class="mt-auto flex items-end justify-between gap-3 pt-4">
		<PluginTags {plugin} showStatus={false} omit={['Assets']} />
		<ArrowUpRight
			size={16}
			class="mb-0.5 flex-shrink-0 text-ink-subtle opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent group-hover:opacity-100"
		/>
	</div>
</a>

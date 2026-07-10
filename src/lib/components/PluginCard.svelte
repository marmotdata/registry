<script lang="ts">
	import { base } from '$app/paths';
	import type { Plugin } from '$lib/types';
	import PluginIcon from './PluginIcon.svelte';
	import OfficialBadge from './OfficialBadge.svelte';

	interface Props {
		plugin: Plugin;
	}

	let { plugin }: Props = $props();
</script>

<a
	href="{base}/{plugin.namespace}/{plugin.name}"
	class="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 no-underline transition-all hover:border-earthy-terracotta-700 dark:hover:border-earthy-terracotta-400 hover:shadow-lg"
>
	<div class="flex items-start gap-4">
		<div
			class="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 group-hover:border-earthy-terracotta-700 dark:group-hover:border-earthy-terracotta-400 transition-colors"
		>
			<PluginIcon iconName={plugin.icon} alt={plugin.display_name} size={32} />
		</div>
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-1.5">
				<h3
					class="m-0 text-base font-semibold text-gray-900 dark:text-white group-hover:text-earthy-terracotta-700 dark:group-hover:text-earthy-terracotta-400 transition-colors truncate"
				>
					{plugin.display_name}
				</h3>
				{#if plugin.official}
					<OfficialBadge size={14} />
				{/if}
			</div>
			<p class="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400 truncate">
				{plugin.namespace}/{plugin.name}
			</p>
			<p class="mt-1.5 m-0 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
				{plugin.description}
			</p>
		</div>
	</div>
</a>

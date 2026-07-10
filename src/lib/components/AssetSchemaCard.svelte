<script lang="ts">
	import { Box } from 'lucide-svelte';
	import type { AssetSchema } from '$lib/types';

	interface Props {
		schema: AssetSchema;
	}

	let { schema }: Props = $props();

	const TYPE_STYLES: Record<string, string> = {
		string:
			'bg-earthy-blue-50 dark:bg-earthy-blue-900/30 text-earthy-blue-800 dark:text-earthy-blue-200 border-earthy-blue-200 dark:border-earthy-blue-800',
		int: 'bg-earthy-green-50 dark:bg-earthy-green-900/30 text-earthy-green-800 dark:text-earthy-green-200 border-earthy-green-200 dark:border-earthy-green-800',
		float:
			'bg-earthy-green-50 dark:bg-earthy-green-900/30 text-earthy-green-800 dark:text-earthy-green-200 border-earthy-green-200 dark:border-earthy-green-800',
		bool: 'bg-earthy-yellow-50 dark:bg-earthy-yellow-900/30 text-earthy-yellow-800 dark:text-earthy-yellow-200 border-earthy-yellow-300 dark:border-earthy-yellow-700'
	};

	function typeStyle(t: string): string {
		const base = t.replace(/\[\]$/, '');
		return (
			TYPE_STYLES[base] ??
			'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
		);
	}
</script>

<section
	class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
>
	<header
		class="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-t-xl"
	>
		<div class="flex items-center gap-2 min-w-0">
			<Box
				size={16}
				class="flex-shrink-0 text-earthy-terracotta-700 dark:text-earthy-terracotta-400"
			/>
			<h3 class="font-semibold text-gray-900 dark:text-white truncate">
				{schema.display_name}
			</h3>
			<code
				class="hidden sm:inline font-mono text-xs text-gray-500 dark:text-gray-400 truncate"
			>
				{schema.struct_name}
			</code>
		</div>
		<span class="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
			{schema.fields.length}
			{schema.fields.length === 1 ? 'field' : 'fields'}
		</span>
	</header>

	{#if schema.description}
		<p class="px-4 pt-3 text-sm text-gray-600 dark:text-gray-400">
			{schema.description}
		</p>
	{/if}

	<div class="divide-y divide-gray-100 dark:divide-gray-800">
		{#each schema.fields as field (field.name)}
			<div class="px-4 py-2.5 flex items-start gap-3 flex-wrap sm:flex-nowrap">
				<div class="flex items-center gap-2 min-w-0 sm:w-56 sm:flex-shrink-0">
					<code
						class="font-mono text-sm text-gray-900 dark:text-white break-all"
					>
						{field.name}
					</code>
					<span
						class="flex-shrink-0 rounded border px-1.5 py-0.5 font-mono text-[0.7rem] {typeStyle(
							field.type
						)}"
					>
						{field.type}
					</span>
				</div>
				<p class="text-sm text-gray-600 dark:text-gray-400 min-w-0 flex-1">
					{field.description || '—'}
				</p>
			</div>
		{/each}
	</div>
</section>

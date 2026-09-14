<script lang="ts">
	import { Box } from 'lucide-svelte';
	import type { AssetSchema } from '$lib/types';
	import type { Tone } from '$lib/taxonomy';
	import Tag from './Tag.svelte';

	interface Props {
		schema: AssetSchema;
	}

	let { schema }: Props = $props();

	const TYPE_TONE: Record<string, Tone> = {
		string: 'blue',
		int: 'green',
		float: 'green',
		bool: 'amber'
	};

	function typeTone(t: string): Tone {
		return TYPE_TONE[t.replace(/\[\]$/, '')] ?? 'neutral';
	}
</script>

<section class="card overflow-hidden">
	<header class="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
		<div class="flex min-w-0 items-center gap-2.5">
			<span class="logo-well h-7 w-7 rounded-lg">
				<Box size={14} class="text-accent" />
			</span>
			<h3 class="m-0 truncate text-base font-semibold text-ink">{schema.display_name}</h3>
			<code class="hidden truncate font-mono text-xs text-ink-subtle sm:inline">{schema.struct_name}</code>
		</div>
		<span class="flex-shrink-0 text-sm text-ink-subtle">
			{schema.fields.length}
			{schema.fields.length === 1 ? 'field' : 'fields'}
		</span>
	</header>

	{#if schema.description}
		<p class="m-0 border-b border-line px-4 py-3 text-sm text-ink-muted">{schema.description}</p>
	{/if}

	<div class="divide-y divide-line">
		{#each schema.fields as field (field.name)}
			<div class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3 sm:flex-nowrap">
				<div class="flex min-w-0 items-center gap-2 sm:w-60 sm:flex-shrink-0">
					<code class="break-all font-mono text-sm text-ink">{field.name}</code>
					<Tag tone={typeTone(field.type)} mono>{field.type}</Tag>
				</div>
				<p class="m-0 min-w-0 flex-1 text-sm text-ink-muted">
					{field.description || '—'}
				</p>
			</div>
		{/each}
	</div>
</section>

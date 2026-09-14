<script lang="ts">
	import { Asterisk, Lock } from 'lucide-svelte';
	import type { ConfigField } from '$lib/types';
	import type { Tone } from '$lib/taxonomy';
	import Tag from './Tag.svelte';
	import Self from './ConfigFieldRow.svelte';

	interface Props {
		field: ConfigField;
		nested?: boolean;
		parentRequired?: boolean;
	}

	let { field, nested = false, parentRequired = true }: Props = $props();

	// A subfield can be structurally required (every entry in an object[]
	// must have `url`) while its parent object is optional. Scope the tooltip
	// so it doesn't read as "you must fill this in".
	let requiredTooltip = $derived(
		field.required && !parentRequired ? 'Required when this object is provided' : 'Required'
	);
	let childrenInherit = $derived(parentRequired && (field.required ?? false));

	const TYPE_TONE: Record<string, Tone> = {
		string: 'blue',
		int: 'green',
		bool: 'amber',
		select: 'neutral',
		multiselect: 'neutral',
		password: 'accent',
		object: 'neutral'
	};

	function typeLabel(f: ConfigField): string {
		if (f.type === 'object') return f.is_array ? 'object[]' : 'object';
		return f.type;
	}

	function fmtDefault(v: unknown): string {
		if (v === null || v === undefined) return '';
		if (typeof v === 'string') return v;
		return JSON.stringify(v);
	}

	let hasDefault = $derived(
		field.default !== undefined && field.default !== null && field.default !== ''
	);
</script>

<div class="flex flex-wrap items-start gap-x-4 gap-y-1.5 py-3.5 sm:flex-nowrap {nested ? 'pl-4 pr-3' : 'px-4'}">
	<div class="flex min-w-0 flex-wrap items-center gap-1.5 sm:w-60 sm:flex-shrink-0">
		<code class="break-all font-mono text-sm font-semibold text-ink">{field.name}</code>
		<Tag tone={TYPE_TONE[field.type] ?? 'neutral'} mono>{typeLabel(field)}</Tag>
		{#if field.required}
			<span
				class="inline-flex flex-shrink-0 items-center text-accent"
				title={requiredTooltip}
				aria-label={requiredTooltip}
			>
				<Asterisk size={13} strokeWidth={2.5} />
			</span>
		{/if}
		{#if field.sensitive}
			<span class="inline-flex flex-shrink-0 items-center text-ink-subtle" title="Sensitive value">
				<Lock size={12} />
			</span>
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		{#if field.description}
			<p class="m-0 text-sm text-ink-muted">{field.description}</p>
		{/if}

		{#if hasDefault || field.placeholder || field.show_when}
			<dl class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-subtle">
				{#if hasDefault}
					<div class="flex items-center gap-1.5">
						<dt>default</dt>
						<dd class="m-0 rounded bg-surface-3 px-1.5 py-0.5 font-mono text-ink-muted">{fmtDefault(field.default)}</dd>
					</div>
				{/if}
				{#if field.placeholder}
					<div class="flex items-center gap-1.5">
						<dt>example</dt>
						<dd class="m-0 rounded bg-surface-3 px-1.5 py-0.5 font-mono text-ink-muted">{field.placeholder}</dd>
					</div>
				{/if}
				{#if field.show_when}
					<div class="flex items-center gap-1.5">
						<dt>shown when</dt>
						<dd class="m-0 rounded bg-surface-3 px-1.5 py-0.5 font-mono text-ink-muted">{field.show_when.field} = {field.show_when.value}</dd>
					</div>
				{/if}
			</dl>
		{/if}

		{#if field.options && field.options.length > 0}
			<div class="mt-2 flex flex-wrap gap-1">
				{#each field.options as opt (opt.value)}
					<Tag mono title={opt.label !== opt.value ? opt.label : undefined}>{opt.value}</Tag>
				{/each}
			</div>
		{/if}

		{#if field.fields && field.fields.length > 0}
			<div class="mt-3 divide-y divide-line rounded-lg border border-line bg-surface-2/60">
				{#each field.fields as sub (sub.name)}
					<Self field={sub} nested parentRequired={childrenInherit} />
				{/each}
			</div>
		{/if}
	</div>
</div>

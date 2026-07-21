<script lang="ts">
	import { Asterisk, Lock } from 'lucide-svelte';
	import type { ConfigField } from '$lib/types';
	import Self from './ConfigFieldRow.svelte';

	interface Props {
		field: ConfigField;
		nested?: boolean;
		parentRequired?: boolean;
	}

	let { field, nested = false, parentRequired = true }: Props = $props();

	// A subfield can be structurally required (e.g. every entry in an object[]
	// must have `url`) while its parent object is itself optional. Tooltip
	// text is scoped so it doesn't read as "you must fill this in" when the
	// parent object was itself optional.
	let requiredTooltip = $derived(
		field.required && !parentRequired ? 'Required when this object is provided' : 'Required'
	);
	let childrenInherit = $derived(parentRequired && (field.required ?? false));

	const TYPE_STYLES: Record<string, string> = {
		string:
			'bg-earthy-blue-50 dark:bg-earthy-blue-900/30 text-earthy-blue-800 dark:text-earthy-blue-200 border-earthy-blue-200 dark:border-earthy-blue-800',
		int: 'bg-earthy-green-50 dark:bg-earthy-green-900/30 text-earthy-green-800 dark:text-earthy-green-200 border-earthy-green-200 dark:border-earthy-green-800',
		bool: 'bg-earthy-yellow-50 dark:bg-earthy-yellow-900/30 text-earthy-yellow-800 dark:text-earthy-yellow-200 border-earthy-yellow-300 dark:border-earthy-yellow-700',
		select:
			'bg-earthy-brown-100 dark:bg-earthy-brown-900/40 text-earthy-brown-800 dark:text-earthy-brown-200 border-earthy-brown-300 dark:border-earthy-brown-700',
		multiselect:
			'bg-earthy-brown-100 dark:bg-earthy-brown-900/40 text-earthy-brown-800 dark:text-earthy-brown-200 border-earthy-brown-300 dark:border-earthy-brown-700',
		password:
			'bg-earthy-terracotta-50 dark:bg-earthy-terracotta-900/30 text-earthy-terracotta-800 dark:text-earthy-terracotta-200 border-earthy-terracotta-200 dark:border-earthy-terracotta-800',
		object:
			'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
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
</script>

<div class="py-2.5 {nested ? 'px-3' : 'px-4'} flex items-start gap-3 flex-wrap sm:flex-nowrap">
	<div
		class="flex items-center gap-1.5 min-w-0 sm:w-56 sm:flex-shrink-0 flex-wrap"
	>
		<code
			class="font-mono text-sm font-semibold text-gray-900 dark:text-white break-all"
		>
			{field.name}
		</code>
		<span
			class="flex-shrink-0 rounded border px-1.5 py-0.5 font-mono text-[0.7rem] {TYPE_STYLES[
				field.type
			] ?? TYPE_STYLES.string}"
		>
			{typeLabel(field)}
		</span>
		{#if field.required}
			<span
				class="flex-shrink-0 inline-flex items-center text-earthy-terracotta-700 dark:text-earthy-terracotta-400"
				title={requiredTooltip}
				aria-label={requiredTooltip}
			>
				<Asterisk size={14} strokeWidth={2.5} />
			</span>
		{/if}
		{#if field.sensitive}
			<span
				class="flex-shrink-0 inline-flex items-center text-earthy-terracotta-700 dark:text-earthy-terracotta-400"
				title="Sensitive"
			>
				<Lock size={12} />
			</span>
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		{#if field.description}
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{field.description}
			</p>
		{/if}

		{#if (field.default !== undefined && field.default !== null && field.default !== '') || field.placeholder || field.show_when}
			<div
				class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400"
			>
				{#if field.default !== undefined && field.default !== null && field.default !== ''}
					<span>
						default
						<code
							class="ml-0.5 rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono text-gray-700 dark:text-gray-300"
						>
							{fmtDefault(field.default)}
						</code>
					</span>
				{/if}
				{#if field.placeholder}
					<span>
						example
						<code
							class="ml-0.5 rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono text-gray-700 dark:text-gray-300"
						>
							{field.placeholder}
						</code>
					</span>
				{/if}
				{#if field.show_when}
					<span>
						shown when
						<code
							class="ml-0.5 rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono text-gray-700 dark:text-gray-300"
						>
							{field.show_when.field} = {field.show_when.value}
						</code>
					</span>
				{/if}
			</div>
		{/if}

		{#if field.options && field.options.length > 0}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each field.options as opt (opt.value)}
					<span
						class="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[0.7rem] text-gray-700 dark:text-gray-300"
					>
						{opt.value}
					</span>
				{/each}
			</div>
		{/if}

		{#if field.fields && field.fields.length > 0}
			<div
				class="mt-2 border-l-2 border-earthy-terracotta-200 dark:border-earthy-terracotta-800 divide-y divide-gray-100 dark:divide-gray-800"
			>
				{#each field.fields as sub (sub.name)}
					<Self field={sub} nested parentRequired={childrenInherit} />
				{/each}
			</div>
		{/if}
	</div>
</div>

<!--
  One configuration field as a two-line outline row, following the schema outline: the key (mono,
  people copy it), its type in everyday words and markers, then the description and any default,
  example or condition. Nested settings indent under a hairline guide. mm-schema-table is built for
  data schemas (nullability, PII, field statistics), so plugin config gets this lighter outline.
-->
<script lang="ts">
	import type { ConfigField } from '$lib/types';
	import Self from './ConfigFieldRow.svelte';

	interface Props {
		field: ConfigField;
		/** Name of the optional group this field sits in, if any. */
		optionalParent?: string;
	}

	let { field, optionalParent }: Props = $props();

	function plainType(f: ConfigField): string {
		switch (f.type) {
			case 'string':
				return 'Text';
			case 'int':
				return 'Number';
			case 'bool':
				return 'Yes or no';
			case 'select':
				return f.options?.length ? 'One of' : 'Text';
			case 'multiselect':
				return f.options?.length ? 'Any of' : 'List of text';
			case 'password':
				return 'Secret';
			case 'object':
				return f.is_array ? 'List of groups' : 'Group of settings';
			default:
				return f.type;
		}
	}

	function fmt(v: unknown): string {
		if (typeof v === 'string') return v;
		return JSON.stringify(v);
	}

	let hasDefault = $derived(
		field.default !== undefined && field.default !== null && field.default !== ''
	);
	let scopedRequired = $derived(field.required && optionalParent !== undefined);
	// Subfields of an optional group are only required once the group is given.
	let childParent = $derived(
		optionalParent ?? (field.required ? undefined : field.name)
	);
</script>

<li class="field">
	<div class="head">
		<code class="key">{field.name}</code>
		<span class="type">{plainType(field)}</span>
		{#if field.required && !scopedRequired}<span class="mm-tag">Required</span>{/if}
		{#if field.sensitive && field.type !== 'password'}
			<span class="mm-tag"><mm-icon name="lock" size={14}></mm-icon>Secret</span>
		{/if}
	</div>

	{#if field.description}
		<p class="description">{field.description}</p>
	{/if}

	{#if field.options && field.options.length > 0}
		<p class="meta">
			<span class="term">Values</span>
			{#each field.options as opt, i (opt.value)}<code title={opt.label !== opt.value ? opt.label : undefined}
					>{opt.value}</code
				>{i < field.options.length - 1 ? ', ' : ''}{/each}
		</p>
	{/if}

	{#if hasDefault || field.placeholder || field.show_when || scopedRequired}
		<p class="meta">
			{#if scopedRequired}
				<span>Required when <code>{optionalParent}</code> is set</span>
			{/if}
			{#if hasDefault}
				<span><span class="term">Default</span> <code>{fmt(field.default)}</code></span>
			{/if}
			{#if field.placeholder}
				<span><span class="term">Example</span> <code>{field.placeholder}</code></span>
			{/if}
			{#if field.show_when}
				<span
					>Used when <code>{field.show_when.field}</code> is <code>{field.show_when.value}</code></span
				>
			{/if}
		</p>
	{/if}

	{#if field.fields && field.fields.length > 0}
		<ul class="children">
			{#each field.fields as sub (sub.name)}
				<Self field={sub} optionalParent={childParent} />
			{/each}
		</ul>
	{/if}
</li>

<style>
	.field {
		display: grid;
		gap: var(--space-1);
		padding-block: var(--space-3);
		border-block-start: 1px solid var(--mm-rule);
	}
	.field:first-child {
		border-block-start: 0;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.key {
		font: var(--text-mono);
		letter-spacing: var(--tracking-mono);
		background: none;
		padding: 0;
		color: var(--mm-text);
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.type {
		font: var(--text-dense);
		color: var(--mm-text-2);
	}
	.mm-tag mm-icon {
		margin-inline-end: 2px;
	}
	.description {
		margin: 0;
		max-inline-size: 72ch;
		font: var(--text-dense);
		color: var(--mm-text-2);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		margin: 0;
		font: var(--text-caption);
		color: var(--mm-text-2);
	}
	.meta .term {
		font-weight: 600;
	}
	.children {
		margin: var(--space-2) 0 0;
		padding: 0;
		padding-inline-start: var(--space-4);
		list-style: none;
		border-inline-start: 1px solid var(--mm-rule);
	}
	.children > :global(.field) {
		padding-block: var(--space-2);
	}
</style>

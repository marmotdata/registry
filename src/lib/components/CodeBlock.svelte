<!--
  Framed code block with a filename/title bar and a copy button. Used for
  generated YAML and shell commands; upstream README code goes through the
  .code-block class from app.css instead.
-->
<script lang="ts">
	import CopyButton from './CopyButton.svelte';

	interface Props {
		code: string;
		title?: string;
		lang?: string;
		prompt?: boolean;
		maxHeight?: string;
	}
	let { code, title, lang, prompt = false, maxHeight }: Props = $props();
</script>

<div class="overflow-hidden rounded-xl border border-line bg-surface">
	{#if title}
		<div
			class="flex h-10 items-center justify-between gap-2 border-b border-line bg-surface-2 pl-3 pr-1.5"
		>
			<span class="flex items-center gap-2 font-mono text-xs text-ink-muted">
				{title}
				{#if lang}
					<span class="text-ink-subtle">{lang}</span>
				{/if}
			</span>
			<CopyButton text={code} label="Copy {title}" />
		</div>
	{/if}
	<div class="relative">
		{#if !title}
			<CopyButton text={code} class="absolute right-1.5 top-1.5" />
		{/if}
		<pre
			class="overflow-auto px-4 py-3.5 font-mono text-code text-ink"
			style={maxHeight ? `max-height:${maxHeight}` : undefined}><code
				>{#if prompt}<span class="select-none text-accent">$ </span>{/if}{code}</code
			></pre>
	</div>
</div>

<!-- Icon button that copies `text` and flashes a check for confirmation. -->
<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';

	interface Props {
		text: string;
		label?: string;
		size?: number;
		class?: string;
	}
	let { text, label = 'Copy to clipboard', size = 14, class: cls = '' }: Props = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1600);
		} catch (err) {
			console.error('Copy failed', err);
		}
	}
</script>

<button
	type="button"
	onclick={copy}
	aria-label={copied ? 'Copied' : label}
	title={copied ? 'Copied' : label}
	class="icon-btn {cls} {copied ? '!text-earthy-green-700 dark:!text-earthy-green-400' : ''}"
>
	{#if copied}
		<Check {size} strokeWidth={2.5} />
	{:else}
		<Copy {size} />
	{/if}
</button>

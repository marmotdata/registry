<script lang="ts">
	import { BadgeCheck } from 'lucide-svelte';

	interface Props {
		size?: number;
	}
	let { size = 16 }: Props = $props();
</script>

<span
	class="relative inline-flex items-center group/badge text-earthy-terracotta-700 dark:text-earthy-terracotta-400"
	tabindex="0"
	aria-label="Core plugin — bundled with Marmot"
>
	<BadgeCheck size={size} strokeWidth={2.25} />
	<span
		role="tooltip"
		class="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 dark:bg-gray-100 px-2 py-1 text-[0.7rem] font-medium text-white dark:text-gray-900 opacity-0 group-hover/badge:opacity-100 group-focus-visible/badge:opacity-100 transition-opacity"
	>
		Core plugin
	</span>
</span>

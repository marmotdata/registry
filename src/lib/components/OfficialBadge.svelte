<!-- Verified check shown next to plugins maintained by the Marmot team. -->
<script lang="ts">
	import { BadgeCheck } from 'lucide-svelte';

	interface Props {
		size?: number;
	}
	let { size = 16 }: Props = $props();
</script>

<span
	class="group/badge relative inline-flex flex-shrink-0 items-center text-accent"
	role="img"
	aria-label="Official plugin, maintained by the Marmot team"
>
	<BadgeCheck {size} strokeWidth={2.25} />
	<span
		role="tooltip"
		class="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-page opacity-0 shadow-pop transition-opacity group-hover/badge:opacity-100"
	>
		Official · maintained by Marmot
	</span>
</span>

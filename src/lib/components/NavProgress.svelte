<!--
  A thin bar under the header while a page loads. Plugin pages fetch their metadata on navigation,
  which can take a moment on a slow connection. Follows the loading rule: appears only after 200ms
  and stays at least 400ms, so fast loads never flash. The design system's loading states
  (mm-loading, mm-skeleton) are for content areas, so this is built from tokens.
-->
<script lang="ts">
	import { navigating } from '$app/state';

	let visible = $state(false);
	let shownAt = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const active = navigating.to !== null;
		clearTimeout(timer);
		if (active && !visible) {
			timer = setTimeout(() => {
				visible = true;
				shownAt = performance.now();
			}, 200);
		} else if (!active && visible) {
			timer = setTimeout(() => (visible = false), Math.max(0, 400 - (performance.now() - shownAt)));
		}
		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div class="progress" role="progressbar" aria-label="Loading page"><span></span></div>
{/if}

<style>
	.progress {
		position: fixed;
		inset-inline: 0;
		inset-block-start: 0;
		z-index: var(--mm-z-toast);
		block-size: 2px;
		overflow: hidden;
		background: var(--mm-sunken);
	}
	span {
		display: block;
		inline-size: 40%;
		block-size: 100%;
		background: var(--mm-text-2);
		animation: travel 1.2s var(--mm-ease) infinite;
	}
	@keyframes travel {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(250%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		span {
			inline-size: 100%;
			animation: none;
			opacity: 0.6;
		}
	}
</style>

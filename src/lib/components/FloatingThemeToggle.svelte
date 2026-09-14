<!-- Small, quiet theme switch pinned bottom-right. Renders only after mount
     so the icon matches the theme applied by the inline script in app.html. -->
<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let isDark = $state(false);
	let mounted = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
		mounted = true;
	});

	function toggle() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		try {
			localStorage.setItem('theme', isDark ? 'dark' : 'light');
		} catch {}
	}
</script>

{#if mounted}
	<button
		type="button"
		onclick={toggle}
		class="fixed bottom-5 right-5 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/90 text-ink-muted shadow-pop backdrop-blur transition-all hover:-translate-y-0.5 hover:text-accent active:translate-y-0"
		aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
		title={isDark ? 'Light theme' : 'Dark theme'}
	>
		{#if isDark}
			<Sun size={17} />
		{:else}
			<Moon size={17} />
		{/if}
	</button>
{/if}

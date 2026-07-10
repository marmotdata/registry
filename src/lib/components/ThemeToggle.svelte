<script lang="ts">
	import { Moon, Sun } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let isDark = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggle() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}
</script>

<button
	type="button"
	onclick={toggle}
	aria-label="Toggle theme"
	class="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-earthy-brown-100 dark:hover:bg-gray-800 transition-colors"
>
	{#if isDark}
		<Sun size={18} />
	{:else}
		<Moon size={18} />
	{/if}
</button>

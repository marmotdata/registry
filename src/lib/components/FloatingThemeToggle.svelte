<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let isDark = $state(false);
	let mounted = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
		mounted = true;
	});

	function toggleColorMode(e: Event) {
		e.preventDefault();
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}
</script>

{#if mounted}
	<!-- svelte-ignore a11y_invalid_attribute -->
	<a
		href="#"
		onclick={toggleColorMode}
		class="fixed bottom-8 right-8 z-50 p-4 rounded-2xl shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-sm inline-flex items-center justify-center"
		aria-label="Toggle theme"
		title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
	>
		{#if isDark}
			<Icon icon="mdi:white-balance-sunny" class="w-7 h-7 text-yellow-400 drop-shadow-md" />
		{:else}
			<Icon
				icon="mdi:moon-waning-crescent"
				class="w-7 h-7 text-indigo-600 dark:text-indigo-400 drop-shadow-md"
			/>
		{/if}
	</a>
{/if}

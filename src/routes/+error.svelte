<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';

	let notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? 'Page not found' : 'Something went wrong'} · Marmot Plugin Registry</title>
</svelte:head>

<div class="error">
	{#if notFound}
		<mm-empty-state
			heading="Page not found"
			description="This plugin or version isn’t in the registry. Browse the registry to find the plugin you need."
		>
			<mm-button slot="action" variant="primary" href="{base}/">Browse plugins</mm-button>
		</mm-empty-state>
	{:else}
		<mm-empty-state
			heading="Something went wrong"
			description="This page couldn’t load. Reload to try again, or go back to the registry."
		>
			<mm-button slot="action" variant="primary" href="{base}/">Browse plugins</mm-button>
		</mm-empty-state>
	{/if}
</div>

<style>
	.error {
		display: grid;
		min-block-size: 50vh;
		align-content: center;
	}
</style>

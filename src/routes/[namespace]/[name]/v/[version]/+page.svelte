<script lang="ts">
	import PluginPage from '$lib/components/PluginPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PluginPage {data} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		ArrowLeft,
		Copy,
		Check,
		ExternalLink,
		Package,
		MousePointerClick,
		Terminal,
		ArrowUpRight,
		Download
	} from 'lucide-svelte';
	import Icon from '@iconify/svelte';

	const ALT_METHODS = [
		{
			name: 'Terraform',
			description: 'Declare assets as infrastructure-as-code.',
			href: 'https://marmotdata.io/docs/Populating/Terraform',
			icon: 'logos:terraform-icon'
		},
		{
			name: 'Pulumi',
			description: 'Native TypeScript, Python, or Go resources.',
			href: 'https://marmotdata.io/docs/Populating/Pulumi',
			icon: 'logos:pulumi-icon'
		},
		{
			name: 'Kubernetes Operator',
			description: 'Sync assets from Kubernetes custom resources.',
			href: 'https://marmotdata.io/docs/Populating/Operator',
			icon: 'logos:kubernetes'
		}
	];
	import PluginIcon from '$lib/components/PluginIcon.svelte';
	import OfficialBadge from '$lib/components/OfficialBadge.svelte';
	import ConfigFieldRow from '$lib/components/ConfigFieldRow.svelte';
	import AssetSchemaCard from '$lib/components/AssetSchemaCard.svelte';
	import { generateYamlExample } from '$lib/yaml-example';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let plugin = $derived(data.plugin);
	let meta = $derived(data.meta);
	let docsHtml = $derived(data.docsHtml);
	let visibleFields = $derived((meta?.config_spec ?? []).filter((f) => !f.hidden));
	let assetSchemas = $derived(meta?.asset_schemas ?? []);

	type TabId = 'overview' | 'usage' | 'configuration' | 'assets';
	let tabs = $derived(
		[
			{ id: 'overview' as TabId, label: 'Overview', show: !!docsHtml },
			{ id: 'usage' as TabId, label: 'Usage', show: true },
			{ id: 'configuration' as TabId, label: 'Configuration', show: !!meta },
			{ id: 'assets' as TabId, label: 'Assets Emitted', show: assetSchemas.length > 0 }
		].filter((t) => t.show)
	);

	// Prefer the README overview if we have one — that's the standard "start
	// here" surface. Falls back to Usage otherwise.
	let activeTab = $state<TabId>(data.docsHtml ? 'overview' : 'usage');
	let configView = $state<'fields' | 'yaml'>('fields');
	let configYaml = $derived(
		meta
			? generateYamlExample({ name: plugin.name, spec: meta.config_spec, mode: 'complete' })
			: ''
	);

	onMount(() => {
		const hash = window.location.hash.slice(1) as TabId;
		if (tabs.some((t) => t.id === hash)) activeTab = hash;
	});

	let yamlExample = $derived(
		meta
			? generateYamlExample({ name: plugin.name, spec: meta.config_spec })
			: `name: my-${plugin.name}-pipeline\nruns:\n  - ${plugin.name}:\n      # See the Configuration tab for available fields.`
	);

	function setTab(id: TabId) {
		activeTab = id;
		if (typeof window !== 'undefined') {
			window.history.replaceState(null, '', `#${id}`);
		}
	}

	let copiedRef = $state<string | null>(null);
	async function copy(text: string, id: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedRef = id;
			setTimeout(() => {
				if (copiedRef === id) copiedRef = null;
			}, 1500);
		} catch (err) {
			console.error('Copy failed', err);
		}
	}

	let latest = $derived(plugin.versions.at(-1));
</script>

<svelte:head>
	<title>{plugin.display_name} — Marmot Plugin Registry</title>
	<meta name="description" content={plugin.description} />
</svelte:head>

<a
	href="{base}/"
	class="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-earthy-terracotta-700 dark:hover:text-earthy-terracotta-400 mb-6"
>
	<ArrowLeft size={16} />
	Back to registry
</a>

<header class="mb-8">
	<div class="flex items-start gap-5 flex-wrap">
		<div
			class="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3"
		>
			<PluginIcon iconName={plugin.icon} alt={plugin.display_name} size={48} />
		</div>
		<div class="min-w-[16rem] flex-1">
			<div class="flex items-center gap-2 flex-wrap">
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
					{plugin.display_name}
				</h1>
				{#if plugin.official}
					<OfficialBadge size={20} />
				{/if}
			</div>
			<p class="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
				{plugin.namespace}/{plugin.name}
			</p>
			<p class="mt-3 text-gray-700 dark:text-gray-300">
				{plugin.description}
			</p>
		</div>
		<button
			type="button"
			onclick={() => setTab('usage')}
			class="group flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-earthy-terracotta-700 hover:bg-earthy-terracotta-800 dark:bg-earthy-terracotta-600 dark:hover:bg-earthy-terracotta-500 text-white font-semibold text-sm px-5 py-2.5 shadow-md shadow-earthy-terracotta-500/25 hover:shadow-lg hover:shadow-earthy-terracotta-500/40 transition-all"
		>
			<Download
				size={16}
				class="transition-transform group-hover:-translate-y-0.5"
			/>
			<span>Install</span>
		</button>
	</div>

	<div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
		{#if plugin.category}
			<div class="flex items-center gap-2">
				<span class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"
					>Category</span
				>
				<span
					class="rounded-full border border-earthy-terracotta-200 dark:border-earthy-terracotta-800 bg-earthy-terracotta-50 dark:bg-earthy-terracotta-900/30 px-2 py-0.5 text-xs font-medium text-earthy-terracotta-800 dark:text-earthy-terracotta-300"
				>
					{plugin.category}
				</span>
			</div>
		{/if}
		{#if plugin.status}
			<div class="flex items-center gap-2">
				<span class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"
					>Status</span
				>
				<span
					class="rounded-full border border-earthy-yellow-300 dark:border-earthy-yellow-700 bg-earthy-yellow-50 dark:bg-earthy-yellow-900/30 px-2 py-0.5 text-xs font-medium text-earthy-yellow-800 dark:text-earthy-yellow-300"
				>
					{plugin.status}
				</span>
			</div>
		{/if}
		{#if plugin.features.length > 0}
			<div class="flex items-center gap-2">
				<span class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"
					>Features</span
				>
				<div class="flex flex-wrap gap-1">
					{#each plugin.features as feature (feature)}
						<span
							class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300"
						>
							{feature}
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</header>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
	<div class="min-w-0">
		{#if tabs.length > 1}
			<div class="border-b border-gray-200 dark:border-gray-700 mb-6">
				<nav class="flex gap-1 -mb-px" role="tablist" aria-label="Plugin sections">
					{#each tabs as tab (tab.id)}
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === tab.id}
							aria-controls="tabpanel-{tab.id}"
							id="tab-{tab.id}"
							onclick={() => setTab(tab.id)}
							class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors {activeTab ===
							tab.id
								? 'border-earthy-terracotta-700 text-earthy-terracotta-700 dark:border-earthy-terracotta-400 dark:text-earthy-terracotta-400'
								: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'}"
						>
							{tab.label}
						</button>
					{/each}
				</nav>
			</div>
		{/if}

		{#if docsHtml}
			<div
				role="tabpanel"
				id="tabpanel-overview"
				aria-labelledby="tab-overview"
				hidden={activeTab !== 'overview'}
				class="prose max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-earthy-terracotta-700 dark:prose-a:text-earthy-terracotta-400 prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-pre:m-0"
			>
				{@html docsHtml}
			</div>
		{/if}

		<div
			role="tabpanel"
			id="tabpanel-usage"
			aria-labelledby="tab-usage"
			hidden={activeTab !== 'usage'}
			class="space-y-4"
		>
			<div class="grid gap-4 md:grid-cols-2 items-stretch">
				<section
					class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 flex flex-col"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex-shrink-0 rounded-xl border border-earthy-blue-200 dark:border-earthy-blue-800/60 bg-gradient-to-br from-earthy-blue-100 to-earthy-blue-50 dark:from-earthy-blue-900/40 dark:to-earthy-blue-900/10 p-2.5"
						>
							<MousePointerClick
								size={22}
								class="text-earthy-blue-700 dark:text-earthy-blue-300"
							/>
						</div>
						<div>
							<h3 class="text-base font-semibold text-gray-900 dark:text-white">
								In the UI
							</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Point-and-click, no config file needed.
							</p>
						</div>
					</div>

					<ol class="mt-5 space-y-3">
						<li class="flex items-start gap-3 text-sm">
							<span
								class="flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-earthy-blue-100 dark:bg-earthy-blue-900/50 text-earthy-blue-800 dark:text-earthy-blue-200 text-[0.65rem] font-bold border border-earthy-blue-200 dark:border-earthy-blue-800/60"
								>1</span
							>
							<span class="text-gray-700 dark:text-gray-300">
								Open
								<code
									class="rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 font-mono text-xs"
									>Runs</code
								>
								→
								<code
									class="rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 font-mono text-xs"
									>Create Pipeline</code
								>
							</span>
						</li>
						<li class="flex items-start gap-3 text-sm">
							<span
								class="flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-earthy-blue-100 dark:bg-earthy-blue-900/50 text-earthy-blue-800 dark:text-earthy-blue-200 text-[0.65rem] font-bold border border-earthy-blue-200 dark:border-earthy-blue-800/60"
								>2</span
							>
							<span class="text-gray-700 dark:text-gray-300">
								Pick
								<span
									class="font-semibold text-earthy-terracotta-700 dark:text-earthy-terracotta-400"
									>{plugin.display_name}</span
								>
								from the plugin list.
							</span>
						</li>
						<li class="flex items-start gap-3 text-sm">
							<span
								class="flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-earthy-blue-100 dark:bg-earthy-blue-900/50 text-earthy-blue-800 dark:text-earthy-blue-200 text-[0.65rem] font-bold border border-earthy-blue-200 dark:border-earthy-blue-800/60"
								>3</span
							>
							<span class="text-gray-700 dark:text-gray-300">
								Fill in the wizard, set a schedule, save.
							</span>
						</li>
					</ol>

					<a
						href="https://marmotdata.io/docs/Populating/UI"
						target="_blank"
						rel="noopener"
						class="group mt-auto pt-5 flex items-center justify-between gap-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-earthy-terracotta-700 dark:hover:text-earthy-terracotta-300 transition-colors"
					>
						<span>Read the full UI guide</span>
						<ArrowUpRight
							size={14}
							class="text-gray-400 dark:text-gray-500 group-hover:text-earthy-terracotta-700 dark:group-hover:text-earthy-terracotta-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
						/>
					</a>
				</section>

				<section
					class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 flex flex-col"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex-shrink-0 rounded-xl border border-earthy-green-200 dark:border-earthy-green-800/60 bg-gradient-to-br from-earthy-green-100 to-earthy-green-50 dark:from-earthy-green-900/40 dark:to-earthy-green-900/10 p-2.5"
						>
							<Terminal
								size={22}
								class="text-earthy-green-700 dark:text-earthy-green-300"
							/>
						</div>
						<div>
							<h3 class="text-base font-semibold text-gray-900 dark:text-white">
								With the CLI
							</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Save a YAML config, then run
								<code class="font-mono text-xs">marmot ingest</code>.
							</p>
						</div>
					</div>

					<div
						class="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
					>
						<div
							class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-1.5"
						>
							<span class="font-mono text-xs text-gray-500 dark:text-gray-400">
								ingest.yaml
							</span>
							<button
								type="button"
								onclick={() => copy(yamlExample, 'yaml')}
								class="rounded-md p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								aria-label="Copy YAML example"
							>
								{#if copiedRef === 'yaml'}
									<Check
										size={14}
										class="text-earthy-green-700 dark:text-earthy-green-400"
									/>
								{:else}
									<Copy size={14} />
								{/if}
							</button>
						</div>
						<pre
							class="overflow-x-auto p-3 font-mono text-xs text-gray-800 dark:text-gray-200 leading-relaxed"><code
								>{yamlExample}</code
							></pre>
					</div>

					<div
						class="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 font-mono text-sm flex items-center gap-2"
					>
						<span
							class="flex-shrink-0 text-earthy-terracotta-700 dark:text-earthy-terracotta-400 select-none"
							>$</span
						>
						<code class="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200"
							>marmot ingest -c ingest.yaml</code
						>
						<button
							type="button"
							onclick={() =>
								copy('marmot ingest -c ingest.yaml', 'ingest')}
							class="flex-shrink-0 rounded-md p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							aria-label="Copy ingest command"
						>
							{#if copiedRef === 'ingest'}
								<Check
									size={14}
									class="text-earthy-green-700 dark:text-earthy-green-400"
								/>
							{:else}
								<Copy size={14} />
							{/if}
						</button>
					</div>
					<a
						href="https://marmotdata.io/docs/Populating/CLI"
						target="_blank"
						rel="noopener"
						class="group mt-auto pt-5 flex items-center justify-between gap-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-earthy-terracotta-700 dark:hover:text-earthy-terracotta-300 transition-colors"
					>
						<span>Read the full CLI guide</span>
						<ArrowUpRight
							size={14}
							class="text-gray-400 dark:text-gray-500 group-hover:text-earthy-terracotta-700 dark:group-hover:text-earthy-terracotta-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
						/>
					</a>
				</section>
			</div>

			<section class="pt-4">
				<div class="mb-3 flex items-baseline justify-between gap-2 flex-wrap">
					<h3
						class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
					>
						Not using plugins? Other ways to populate Marmot
					</h3>
				</div>
				<div class="grid gap-3 sm:grid-cols-3">
					{#each ALT_METHODS as method (method.href)}
						<a
							href={method.href}
							target="_blank"
							rel="noopener"
							class="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 transition-all hover:-translate-y-0.5 hover:border-earthy-terracotta-400 dark:hover:border-earthy-terracotta-500 hover:shadow-lg hover:shadow-earthy-terracotta-500/10"
						>
							<div class="flex items-start gap-3">
								<div
									class="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 transition-colors group-hover:border-earthy-terracotta-300 dark:group-hover:border-earthy-terracotta-500/60"
								>
									<Icon icon={method.icon} width={24} height={24} />
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between gap-2">
										<h4
											class="font-semibold text-gray-900 dark:text-white truncate"
										>
											{method.name}
										</h4>
										<ArrowUpRight
											size={14}
											class="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-earthy-terracotta-700 dark:group-hover:text-earthy-terracotta-300 transition-colors"
										/>
									</div>
									<p
										class="mt-0.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
									>
										{method.description}
									</p>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		</div>

		{#if meta}
			<div
				role="tabpanel"
				id="tabpanel-configuration"
				aria-labelledby="tab-configuration"
				hidden={activeTab !== 'configuration'}
			>
				<div class="mb-4 flex items-center justify-between gap-3 flex-wrap">
					<div>
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
							Configuration
						</h2>
						<p class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
							{visibleFields.length} top-level {visibleFields.length === 1
								? 'field'
								: 'fields'}.
						</p>
					</div>
					<div
						class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5"
						role="tablist"
						aria-label="Configuration view"
					>
						<button
							type="button"
							role="tab"
							aria-selected={configView === 'fields'}
							onclick={() => (configView = 'fields')}
							class="rounded-md px-3 py-1 text-xs font-medium transition-colors {configView ===
							'fields'
								? 'bg-earthy-terracotta-50 dark:bg-earthy-terracotta-900/40 text-earthy-terracotta-800 dark:text-earthy-terracotta-200'
								: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}"
						>
							Fields
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={configView === 'yaml'}
							onclick={() => (configView = 'yaml')}
							class="rounded-md px-3 py-1 text-xs font-medium transition-colors {configView ===
							'yaml'
								? 'bg-earthy-terracotta-50 dark:bg-earthy-terracotta-900/40 text-earthy-terracotta-800 dark:text-earthy-terracotta-200'
								: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}"
						>
							YAML
						</button>
					</div>
				</div>

				{#if visibleFields.length === 0}
					<div
						class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 text-sm text-gray-600 dark:text-gray-400"
					>
						This plugin takes no configuration.
					</div>
				{:else if configView === 'fields'}
					<div
						class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800"
					>
						{#each visibleFields as field (field.name)}
							<ConfigFieldRow {field} />
						{/each}
					</div>
				{:else}
					<div
						class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
					>
						<div
							class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-1.5"
						>
							<span class="font-mono text-xs text-gray-500 dark:text-gray-400">
								ingest.yaml
							</span>
							<button
								type="button"
								onclick={() => copy(configYaml, 'config-yaml')}
								class="rounded-md p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								aria-label="Copy YAML"
							>
								{#if copiedRef === 'config-yaml'}
									<Check
										size={14}
										class="text-earthy-green-700 dark:text-earthy-green-400"
									/>
								{:else}
									<Copy size={14} />
								{/if}
							</button>
						</div>
						<pre
							class="overflow-x-auto p-3 font-mono text-xs text-gray-800 dark:text-gray-200 leading-relaxed max-h-[70vh]"><code
								>{configYaml}</code
							></pre>
					</div>
				{/if}
			</div>
		{/if}

		{#if assetSchemas.length > 0}
			<div
				role="tabpanel"
				id="tabpanel-assets"
				aria-labelledby="tab-assets"
				hidden={activeTab !== 'assets'}
			>
				<div class="mb-4">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
						Assets Emitted
					</h2>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
						Metadata fields this plugin attaches to each discovered asset.
					</p>
				</div>
				<div class="space-y-3">
					{#each assetSchemas as schema (schema.struct_name)}
						<AssetSchemaCard {schema} />
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<aside class="space-y-4 lg:sticky lg:top-20 lg:self-start">
		<section
			class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
		>
			<div class="flex items-center gap-2">
				<Package
					size={16}
					class="text-earthy-terracotta-700 dark:text-earthy-terracotta-400"
				/>
				<h3
					class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
				>
					Latest
				</h3>
			</div>
			<p class="mt-1 font-mono text-lg font-semibold text-gray-900 dark:text-white">
				v{plugin.latest_version}
			</p>
		</section>

		<section
			class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
		>
			<h3
				class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3"
			>
				Versions
			</h3>
			<ul class="space-y-2">
				{#each plugin.versions.slice().reverse() as version (version.version)}
					<li>
						<div class="flex items-center justify-between gap-2">
							<span class="font-mono text-sm text-gray-900 dark:text-white"
								>v{version.version}</span
							>
							{#if version.version === plugin.latest_version}
								<span
									class="rounded-full bg-earthy-green-100 dark:bg-earthy-green-900/30 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-earthy-green-800 dark:text-earthy-green-300"
								>
									Latest
								</span>
							{/if}
						</div>
						<button
							type="button"
							onclick={() => copy(version.oci_ref, `oci-${version.version}`)}
							class="mt-0.5 flex w-full items-center gap-1 text-left font-mono text-[0.7rem] text-gray-500 dark:text-gray-400 hover:text-earthy-terracotta-700 dark:hover:text-earthy-terracotta-400"
						>
							{#if copiedRef === `oci-${version.version}`}
								<Check size={10} class="flex-shrink-0" />
								<span>Copied</span>
							{:else}
								<Copy size={10} class="flex-shrink-0" />
								<span class="truncate">{version.digest.slice(0, 19)}…</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</section>

		{#if plugin.source}
			<section
				class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
			>
				<h3
					class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
				>
					Source
				</h3>
				<a
					href={plugin.source}
					target="_blank"
					rel="noopener"
					class="flex items-center gap-1 text-sm text-earthy-terracotta-700 dark:text-earthy-terracotta-400 hover:underline"
					title={plugin.source}
				>
					<span class="min-w-0 flex-1 truncate">
						{plugin.source.replace(/^https?:\/\//, '')}
					</span>
					<ExternalLink size={12} class="flex-shrink-0" />
				</a>
			</section>
		{/if}
	</aside>
</div>

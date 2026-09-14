<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import {
		ChevronRight,
		ChevronDown,
		Info,
		ExternalLink,
		MousePointerClick,
		Terminal,
		ArrowUpRight,
		Download,
		BookOpen,
		Settings2,
		Boxes,
		Github,
		BadgeCheck,
		Users,
		Tag as TagIcon
	} from 'lucide-svelte';
	import Icon from '@iconify/svelte';
	import PluginIcon from '$lib/components/PluginIcon.svelte';
	import OfficialBadge from '$lib/components/OfficialBadge.svelte';
	import PluginTags from '$lib/components/PluginTags.svelte';
	import CategoryTag from '$lib/components/CategoryTag.svelte';
	import StatusTag from '$lib/components/StatusTag.svelte';
	import FeatureTag from '$lib/components/FeatureTag.svelte';
	import ConfigFieldRow from '$lib/components/ConfigFieldRow.svelte';
	import AssetSchemaCard from '$lib/components/AssetSchemaCard.svelte';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { categoryOf, sortFeatures } from '$lib/taxonomy';
	import { generateYamlExample } from '$lib/yaml-example';
	import type { PluginPageData } from '$lib/plugin-page';
	import type { PluginVersion } from '$lib/types';

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

	let { data }: { data: PluginPageData } = $props();
	let plugin = $derived(data.plugin);
	let version = $derived(data.version);
	let isLatest = $derived(data.isLatest);
	let meta = $derived(data.meta);
	let docsHtml = $derived(data.docsHtml);
	let hasDocs = $derived(!!meta || !!docsHtml);
	let visibleFields = $derived((meta?.config_spec ?? []).filter((f) => !f.hidden));
	let assetSchemas = $derived(meta?.asset_schemas ?? []);
	let category = $derived(categoryOf(plugin));
	let features = $derived(sortFeatures(plugin.features));
	let latest = $derived(plugin.versions.at(-1));
	let pluginId = $derived(`${plugin.namespace}/${plugin.name}`);
	let pluginHref = $derived(`${base}/${plugin.namespace}/${plugin.name}`);

	/** Latest lives at the plain plugin URL; every other version under /v/. */
	function versionHref(v: PluginVersion): string {
		return v === latest ? pluginHref : `${pluginHref}/v/${v.version}`;
	}

	function onVersionChange(e: Event) {
		const picked = plugin.versions.find((v) => v.version === (e.target as HTMLSelectElement).value);
		if (picked) goto(versionHref(picked) + (activeTab ? `#${activeTab}` : ''));
	}

	type TabId = 'overview' | 'usage' | 'configuration' | 'assets';
	let tabs = $derived(
		[
			{ id: 'overview' as TabId, label: 'Overview', icon: BookOpen, count: null, show: !!docsHtml },
			{ id: 'usage' as TabId, label: 'Usage', icon: Terminal, count: null, show: true },
			{
				id: 'configuration' as TabId,
				label: 'Configuration',
				icon: Settings2,
				count: meta ? visibleFields.length : null,
				show: !!meta
			},
			{
				id: 'assets' as TabId,
				label: 'Assets emitted',
				icon: Boxes,
				count: assetSchemas.length,
				show: assetSchemas.length > 0
			}
		].filter((t) => t.show)
	);

	// Prefer the README overview when there is one; it's the "start here" surface.
	// svelte-ignore state_referenced_locally
	let activeTab = $state<TabId>(data.docsHtml ? 'overview' : 'usage');
	let configView = $state<'fields' | 'yaml'>('fields');
	let configYaml = $derived(
		meta ? generateYamlExample({ name: plugin.name, spec: meta.config_spec, mode: 'complete' }) : ''
	);

	onMount(() => {
		const hash = window.location.hash.slice(1) as TabId;
		if (tabs.some((t) => t.id === hash)) activeTab = hash;
	});

	// Switching version can remove the tab that was open (an old release with
	// no README). Fall back to the first tab that still exists.
	$effect(() => {
		if (!tabs.some((t) => t.id === activeTab)) activeTab = tabs[0]?.id ?? 'usage';
	});

	let yamlExample = $derived(
		meta
			? generateYamlExample({ name: plugin.name, spec: meta.config_spec })
			: `name: my-${plugin.name}-pipeline\nruns:\n  - ${plugin.name}:\n      # No config spec was published for v${version.version}.\n      # See a newer release for the available fields.`
	);

	function setTab(id: TabId) {
		activeTab = id;
		if (typeof window !== 'undefined') {
			window.history.replaceState(window.history.state, '', `#${id}`);
		}
	}

	function onTabKeydown(e: KeyboardEvent) {
		const i = tabs.findIndex((t) => t.id === activeTab);
		if (e.key === 'ArrowRight') setTab(tabs[(i + 1) % tabs.length].id);
		else if (e.key === 'ArrowLeft') setTab(tabs[(i - 1 + tabs.length) % tabs.length].id);
		else return;
		e.preventDefault();
		(document.getElementById(`tab-${activeTab}`) as HTMLElement | null)?.focus();
	}

	const INGEST_CMD = 'marmot ingest -c ingest.yaml';
</script>

<svelte:head>
	<title>{plugin.display_name}{isLatest ? '' : ` v${version.version}`} · Marmot Plugin Registry</title>
	<meta name="description" content={plugin.description} />
</svelte:head>

<!-- Breadcrumb ------------------------------------------------------------- -->
<nav class="mb-6 flex items-center gap-1 text-sm text-ink-subtle" aria-label="Breadcrumb">
	<a href="{base}/" class="rounded px-1 py-0.5 transition-colors hover:text-accent">Registry</a>
	{#if category}
		<ChevronRight size={13} class="flex-shrink-0 opacity-60" />
		<a
			href="{base}/?category={category.id}"
			class="rounded px-1 py-0.5 transition-colors hover:text-accent"
		>
			{category.label}
		</a>
	{/if}
	<ChevronRight size={13} class="flex-shrink-0 opacity-60" />
	<span class="truncate px-1 py-0.5 font-medium text-ink" aria-current="page">{plugin.display_name}</span>
</nav>

<!-- Header ----------------------------------------------------------------- -->
<header class="mb-8 animate-fade-up">
	<div class="flex flex-wrap items-start gap-5">
		<div class="logo-well h-16 w-16 rounded-2xl">
			<PluginIcon iconName={plugin.icon} alt={plugin.display_name} size={38} />
		</div>

		<div class="min-w-[16rem] flex-1">
			<div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
				<h1 class="m-0 text-3xl font-bold tracking-tight text-ink">
					{plugin.display_name}
				</h1>
				{#if plugin.official}
					<OfficialBadge size={20} />
				{/if}
			</div>
			<div class="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-ink-subtle">
				<code class="font-mono">{pluginId}</code>
				<CopyButton text={pluginId} label="Copy plugin id" size={12} class="!h-6 !w-6" />
				{#if plugin.versions.length > 1}
					<span class="mx-1 opacity-50" aria-hidden="true">·</span>
					<label class="relative inline-flex items-center">
						<span class="sr-only">Version</span>
						<select
							value={version.version}
							onchange={onVersionChange}
							class="h-7 cursor-pointer appearance-none rounded-md border border-line bg-surface pl-2.5 pr-7 font-mono text-xs text-ink transition-colors hover:border-line-strong focus:border-accent/60 focus:outline-none"
						>
							{#each plugin.versions.slice().reverse() as v (v.version)}
								<option value={v.version}>v{v.version}{v === latest ? ' (latest)' : ''}</option>
							{/each}
						</select>
						<ChevronDown size={13} class="pointer-events-none absolute right-2 text-ink-subtle" />
					</label>
				{:else}
					<span class="mx-1 opacity-50" aria-hidden="true">·</span>
					<code class="font-mono">v{version.version}</code>
				{/if}
			</div>
			<p class="mt-3 max-w-2xl text-lg leading-relaxed text-ink-muted text-pretty">
				{plugin.description}
			</p>
			<div class="mt-4">
				<PluginTags {plugin} size="md" />
			</div>
		</div>

		<div class="flex w-full flex-shrink-0 items-center gap-2 sm:w-auto">
			<button type="button" onclick={() => setTab('usage')} class="btn-primary group flex-1 sm:flex-none">
				<Download size={16} class="transition-transform group-hover:-translate-y-0.5" />
				Install
			</button>
			{#if plugin.source}
				<a href={plugin.source} target="_blank" rel="noopener" class="btn-secondary" title="View source">
					<Github size={16} />
					<span class="hidden sm:inline">Source</span>
				</a>
			{/if}
		</div>
	</div>
</header>

{#if !isLatest && latest}
	<div
		class="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-earthy-yellow-400/60 bg-earthy-yellow-100 px-4 py-3 text-sm text-[#7a5a12] dark:border-earthy-yellow-700/40 dark:bg-earthy-yellow-900/25 dark:text-earthy-yellow-400"
		role="status"
	>
		<Info size={16} class="flex-shrink-0" />
		<span>
			You're viewing <span class="font-mono font-semibold">v{version.version}</span>. The latest
			release is <span class="font-mono font-semibold">v{latest.version}</span>.
		</span>
		<a href={pluginHref} class="ml-auto font-medium underline-offset-2 hover:underline">
			View latest
		</a>
	</div>
{/if}

{#if !hasDocs}
	<div
		class="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted"
		role="status"
	>
		<Info size={16} class="flex-shrink-0 text-ink-subtle" />
		<span>
			No docs were published for <span class="font-mono">v{version.version}</span>. It installs
			like any other release; see a newer version for configuration details.
		</span>
	</div>
{/if}

<div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
	<div class="min-w-0">
		<!-- Tabs -------------------------------------------------------------- -->
		{#if tabs.length > 1}
			<div class="mb-6 border-b border-line">
				<div
					class="-mb-px flex gap-1 overflow-x-auto"
					role="tablist"
					tabindex="-1"
					aria-label="Plugin sections"
					onkeydown={onTabKeydown}
				>
					{#each tabs as tab (tab.id)}
						{@const active = activeTab === tab.id}
						<button
							type="button"
							role="tab"
							aria-selected={active}
							aria-controls="tabpanel-{tab.id}"
							id="tab-{tab.id}"
							tabindex={active ? 0 : -1}
							onclick={() => setTab(tab.id)}
							class="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition-colors {active
								? 'border-accent text-ink'
								: 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink'}"
						>
							<tab.icon size={15} class={active ? 'text-accent' : 'text-ink-subtle'} />
							{tab.label}
							{#if tab.count !== null}
								<span
									class="rounded-md px-1.5 py-px text-xs tabular-nums {active
										? 'bg-accent-soft text-accent-ink'
										: 'bg-surface-3 text-ink-subtle'}"
								>
									{tab.count}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Overview ---------------------------------------------------------- -->
		{#if docsHtml}
			<div
				role="tabpanel"
				id="tabpanel-overview"
				aria-labelledby="tab-overview"
				hidden={activeTab !== 'overview'}
				class="prose prose-neutral max-w-none dark:prose-invert
					prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-ink
					prose-h2:mt-10 prose-h2:border-b prose-h2:border-line prose-h2:pb-2 prose-h2:text-xl
					prose-h3:text-base
					prose-p:text-ink-muted prose-li:text-ink-muted prose-strong:text-ink
					prose-a:font-medium prose-a:text-accent prose-a:no-underline hover:prose-a:underline
					prose-code:rounded-md prose-code:border prose-code:border-line prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.9em] prose-code:font-normal prose-code:text-ink prose-code:before:content-none prose-code:after:content-none
					prose-pre:m-0 prose-pre:border-0 prose-pre:bg-transparent prose-pre:p-0
					prose-table:text-sm prose-th:text-ink prose-td:text-ink-muted
					prose-hr:border-line prose-blockquote:border-accent/40 prose-blockquote:text-ink-muted"
			>
				{@html docsHtml}
			</div>
		{/if}

		<!-- Usage ------------------------------------------------------------- -->
		<div
			role="tabpanel"
			id="tabpanel-usage"
			aria-labelledby="tab-usage"
			hidden={activeTab !== 'usage'}
			class="space-y-8"
		>
			<div class="grid items-stretch gap-4 md:grid-cols-2">
				<section class="card flex flex-col p-5">
					<div class="flex items-center gap-3">
						<span class="logo-well h-10 w-10">
							<MousePointerClick size={19} class="text-earthy-blue-700 dark:text-earthy-blue-300" />
						</span>
						<div>
							<h3 class="m-0 text-base font-semibold text-ink">In the UI</h3>
							<p class="m-0 text-sm text-ink-muted">Point-and-click, no config file needed.</p>
						</div>
					</div>

					<ol class="m-0 mt-5 list-none space-y-3 p-0">
						{#each [
							{ n: 1, html: true },
							{ n: 2, html: false },
							{ n: 3, html: false }
						] as step (step.n)}
							<li class="flex items-start gap-3 text-sm">
								<span
									class="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-xs font-semibold text-ink-muted"
									>{step.n}</span
								>
								<span class="text-ink-muted">
									{#if step.n === 1}
										Open <kbd class="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-xs text-ink">Runs</kbd>
										<ChevronRight size={12} class="inline opacity-60" />
										<kbd class="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-xs text-ink">Create pipeline</kbd>
									{:else if step.n === 2}
										Pick <span class="font-semibold text-ink">{plugin.display_name}</span> from the plugin list.
									{:else}
										Fill in the wizard, set a schedule, save.
									{/if}
								</span>
							</li>
						{/each}
					</ol>

					<a
						href="https://marmotdata.io/docs/Populating/UI"
						target="_blank"
						rel="noopener"
						class="group mt-auto flex items-center justify-between gap-2 pt-5 text-sm font-medium text-ink transition-colors hover:text-accent"
					>
						<span>Read the UI guide</span>
						<ArrowUpRight
							size={14}
							class="text-ink-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
						/>
					</a>
				</section>

				<section class="card flex flex-col p-5">
					<div class="flex items-center gap-3">
						<span class="logo-well h-10 w-10">
							<Terminal size={19} class="text-earthy-green-700 dark:text-earthy-green-300" />
						</span>
						<div>
							<h3 class="m-0 text-base font-semibold text-ink">With the CLI</h3>
							<p class="m-0 text-sm text-ink-muted">
								Save a YAML config, then run <code class="font-mono text-xs text-ink">marmot ingest</code>.
							</p>
						</div>
					</div>

					<div class="mt-4 space-y-2">
						<CodeBlock code={yamlExample} title="ingest.yaml" lang="yaml" />
						<CodeBlock code={INGEST_CMD} prompt />
					</div>

					<a
						href="https://marmotdata.io/docs/Populating/CLI"
						target="_blank"
						rel="noopener"
						class="group mt-auto flex items-center justify-between gap-2 pt-5 text-sm font-medium text-ink transition-colors hover:text-accent"
					>
						<span>Read the CLI guide</span>
						<ArrowUpRight
							size={14}
							class="text-ink-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
						/>
					</a>
				</section>
			</div>

			<section>
				<h3 class="mb-3 text-base font-semibold text-ink">Not using plugins? Other ways to populate Marmot</h3>
				<div class="grid gap-3 sm:grid-cols-3">
					{#each ALT_METHODS as method (method.href)}
						<a href={method.href} target="_blank" rel="noopener" class="card-link group flex items-start gap-3 p-4 no-underline">
							<span class="logo-well h-9 w-9 rounded-lg">
								<Icon icon={method.icon} width={20} height={20} />
							</span>
							<span class="min-w-0 flex-1">
								<span class="flex items-center justify-between gap-2">
									<span class="truncate text-sm font-semibold text-ink group-hover:text-accent">{method.name}</span>
									<ArrowUpRight size={14} class="flex-shrink-0 text-ink-subtle transition-colors group-hover:text-accent" />
								</span>
								<span class="mt-0.5 block text-sm text-ink-muted">{method.description}</span>
							</span>
						</a>
					{/each}
				</div>
			</section>
		</div>

		<!-- Configuration ----------------------------------------------------- -->
		{#if meta}
			<div
				role="tabpanel"
				id="tabpanel-configuration"
				aria-labelledby="tab-configuration"
				hidden={activeTab !== 'configuration'}
			>
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 class="m-0 text-xl font-semibold tracking-tight text-ink">Configuration</h2>
						<p class="m-0 mt-0.5 text-sm text-ink-muted">
							{visibleFields.length} top-level {visibleFields.length === 1 ? 'field' : 'fields'}.
							<span class="text-accent">*</span> marks required fields.
						</p>
					</div>
					<div
						class="inline-flex rounded-lg border border-line bg-surface-2 p-0.5"
						role="tablist"
						aria-label="Configuration view"
					>
						{#each [{ id: 'fields', label: 'Fields' }, { id: 'yaml', label: 'YAML' }] as v (v.id)}
							<button
								type="button"
								role="tab"
								aria-selected={configView === v.id}
								onclick={() => (configView = v.id as 'fields' | 'yaml')}
								class="rounded-md px-3 py-1.5 text-sm font-medium transition-all {configView === v.id
									? 'bg-surface text-ink shadow-card'
									: 'text-ink-muted hover:text-ink'}"
							>
								{v.label}
							</button>
						{/each}
					</div>
				</div>

				{#if visibleFields.length === 0}
					<div class="card p-6 text-sm text-ink-muted">This plugin takes no configuration.</div>
				{:else if configView === 'fields'}
					<div class="card divide-y divide-line overflow-hidden">
						{#each visibleFields as field (field.name)}
							<ConfigFieldRow {field} />
						{/each}
					</div>
				{:else}
					<CodeBlock code={configYaml} title="ingest.yaml" lang="yaml" maxHeight="70vh" />
				{/if}
			</div>
		{/if}

		<!-- Assets ------------------------------------------------------------ -->
		{#if assetSchemas.length > 0}
			<div
				role="tabpanel"
				id="tabpanel-assets"
				aria-labelledby="tab-assets"
				hidden={activeTab !== 'assets'}
			>
				<div class="mb-4">
					<h2 class="m-0 text-xl font-semibold tracking-tight text-ink">Assets emitted</h2>
					<p class="m-0 mt-0.5 text-sm text-ink-muted">
						Metadata this plugin attaches to each discovered asset.
					</p>
				</div>
				<div class="space-y-4">
					{#each assetSchemas as schema (schema.struct_name)}
						<AssetSchemaCard {schema} />
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Sidebar ------------------------------------------------------------- -->
	<aside class="space-y-4 lg:sticky lg:top-20 lg:self-start">
		{#if version}
			<section class="card p-4">
				<div class="flex items-baseline justify-between gap-2">
					<h3 class="eyebrow m-0">{isLatest ? 'Latest release' : 'This release'}</h3>
					<span class="font-mono text-base font-semibold text-ink">v{version.version}</span>
				</div>
				<dl class="mt-3 space-y-3 text-sm">
					<div>
						<dt class="mb-1 text-ink-subtle">OCI reference</dt>
						<dd class="m-0 flex items-center gap-1 rounded-lg border border-line bg-surface-2 py-1.5 pl-3 pr-1.5">
							<code class="min-w-0 flex-1 truncate font-mono text-xs text-ink" title={version.oci_ref}>{version.oci_ref}</code>
							<CopyButton text={version.oci_ref} label="Copy OCI reference" size={12} class="!h-6 !w-6" />
						</dd>
					</div>
					<div>
						<dt class="mb-1 text-ink-subtle">Digest</dt>
						<dd class="m-0 flex items-center gap-1 rounded-lg border border-line bg-surface-2 py-1.5 pl-3 pr-1.5">
							<code class="min-w-0 flex-1 truncate font-mono text-xs text-ink" title={version.digest}>{version.digest}</code>
							<CopyButton text={version.digest} label="Copy digest" size={12} class="!h-6 !w-6" />
						</dd>
					</div>
				</dl>
			</section>
		{/if}

		<section class="card p-4">
			<h3 class="eyebrow m-0 mb-3">About</h3>
			<dl class="m-0 space-y-3 text-sm">
				<div class="flex items-start justify-between gap-3">
					<dt class="text-ink-subtle">Maintainer</dt>
					<dd class="m-0 flex items-center gap-1.5 font-medium text-ink">
						{#if plugin.official}
							<BadgeCheck size={14} class="text-accent" /> Marmot
						{:else}
							<Users size={14} class="text-ink-subtle" /> Community
						{/if}
					</dd>
				</div>
				{#if category}
					<div class="flex items-start justify-between gap-3">
						<dt class="text-ink-subtle">Category</dt>
						<dd class="m-0"><a href="{base}/?category={category.id}" class="no-underline"><CategoryTag id={category.id} /></a></dd>
					</div>
				{/if}
				{#if plugin.status}
					<div class="flex items-start justify-between gap-3">
						<dt class="text-ink-subtle">Status</dt>
						<dd class="m-0"><StatusTag slug={plugin.status} /></dd>
					</div>
				{/if}
				{#if features.length > 0}
					<div class="flex items-start justify-between gap-3">
						<dt class="flex-shrink-0 text-ink-subtle">Capabilities</dt>
						<dd class="m-0 flex flex-wrap justify-end gap-1">
							{#each features as f (f.name)}
								<a href="{base}/?feature={encodeURIComponent(f.name)}" class="no-underline"><FeatureTag name={f.name} /></a>
							{/each}
						</dd>
					</div>
				{/if}
				{#if plugin.source}
					<div class="flex items-start justify-between gap-3">
						<dt class="text-ink-subtle">Source</dt>
						<dd class="m-0 min-w-0">
							<a
								href={plugin.source}
								target="_blank"
								rel="noopener"
								class="flex items-center gap-1 font-medium text-accent hover:underline"
								title={plugin.source}
							>
								<span class="truncate">{plugin.source.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/tree\/main\/.*$/, '')}</span>
								<ExternalLink size={11} class="flex-shrink-0" />
							</a>
						</dd>
					</div>
				{/if}
			</dl>
		</section>

		<section class="card p-4">
			<div class="mb-3 flex items-baseline justify-between">
				<h3 class="eyebrow m-0">Versions</h3>
				<span class="text-sm text-ink-subtle">{plugin.versions.length}</span>
			</div>
			<ul class="m-0 list-none space-y-0.5 p-0">
				{#each plugin.versions.slice().reverse() as v (v.version)}
					{@const isCurrent = v.version === version.version}
					{@const isNewest = v === latest}
					<li class="group -mx-2 flex items-center gap-2 rounded-lg transition-colors {isCurrent ? 'bg-accent-soft' : 'hover:bg-surface-2'}">
						<a
							href={versionHref(v)}
							aria-current={isCurrent ? 'page' : undefined}
							class="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 no-underline"
						>
							<TagIcon size={12} class="flex-shrink-0 {isCurrent ? 'text-accent' : 'text-ink-subtle'}" />
							<span class="font-mono text-sm {isCurrent ? 'font-semibold text-accent-ink' : 'text-ink-muted group-hover:text-ink'}">v{v.version}</span>
							{#if isNewest}
								<span class="rounded-md px-1.5 py-px text-xs font-medium {isCurrent ? 'bg-accent/15 text-accent-ink' : 'bg-accent-soft text-accent-ink'}">Latest</span>
							{/if}
							<code class="ml-auto truncate font-mono text-xs text-ink-subtle" title={v.digest}>{v.digest.slice(7, 15)}</code>
						</a>
						<CopyButton text={v.oci_ref} label="Copy OCI reference for v{v.version}" size={12} class="!h-6 !w-6 mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" />
					</li>
				{/each}
			</ul>
		</section>
	</aside>
</div>

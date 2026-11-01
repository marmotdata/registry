<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { setProps } from '$lib/props';
	import { SITE_URL } from '$lib/site';
	import PluginIcon from '$lib/components/PluginIcon.svelte';
	import ConfigFieldRow from '$lib/components/ConfigFieldRow.svelte';
	import { categoryOf, sortFeatures, statusInfo } from '$lib/taxonomy';
	import { generateYamlExample } from '$lib/yaml-example';
	import type { PluginPageData } from '$lib/plugin-page';
	import type { AssetSchema, PluginVersion } from '$lib/types';

	const ALT_METHODS = [
		{
			name: 'Terraform',
			description: 'Declare assets as infrastructure as code.',
			href: 'https://marmotdata.io/docs/Populating/Terraform',
			icon: 'terraform'
		},
		{
			name: 'Pulumi',
			description: 'Define assets as TypeScript, Python or Go resources.',
			href: 'https://marmotdata.io/docs/Populating/Pulumi',
			icon: 'pulumi'
		},
		{
			name: 'Kubernetes operator',
			description: 'Sync assets from Kubernetes custom resources.',
			href: 'https://marmotdata.io/docs/Populating/Operator',
			icon: 'kubernetes'
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
	let status = $derived(plugin.status ? statusInfo(plugin.status) : null);
	let latest = $derived(plugin.versions.at(-1));
	let pluginId = $derived(`${plugin.namespace}/${plugin.name}`);
	let pluginHref = $derived(`${base}/${plugin.namespace}/${plugin.name}`);
	/** Advisories against the version being viewed, most severe first. */
	let advisories = $derived(
		(plugin.advisories ?? [])
			.filter((a) => version.advisories?.includes(a.id))
			.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
	);

	const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low'];

	function severityLabel(severity: string): string {
		return severity.charAt(0).toUpperCase() + severity.slice(1);
	}

	/** Where to send someone off a vulnerable version: the fixed release's page. */
	function fixedHref(fixed: string): string {
		const v = plugin.versions.find((x) => x.version === fixed);
		return v ? versionHref(v) : pluginHref;
	}

	/** Latest lives at the plain plugin URL; every other version under /v/. */
	function versionHref(v: PluginVersion): string {
		return v === latest ? pluginHref : `${pluginHref}/v/${v.version}`;
	}

	function onVersionChange(e: Event) {
		const picked = plugin.versions.find((v) => v.version === (e.currentTarget as HTMLInputElement).value);
		if (picked && picked.version !== version.version)
			goto(versionHref(picked) + (activeTab ? `#${activeTab}` : ''));
	}

	type TabId = 'overview' | 'usage' | 'configuration' | 'assets';
	let tabs = $derived(
		[
			{ id: 'overview' as TabId, label: 'Overview', icon: 'menu-book', count: null, show: !!docsHtml },
			{ id: 'usage' as TabId, label: 'Usage', icon: 'terminal', count: null, show: true },
			{
				id: 'configuration' as TabId,
				label: 'Configuration', icon: 'settings',
				count: meta ? visibleFields.length : null,
				show: !!meta
			},
			{
				id: 'assets' as TabId,
				label: 'Assets emitted', icon: 'inventory-2',
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
			: `name: my-${plugin.name}-pipeline\nruns:\n  - ${plugin.name}:\n      # This release published no configuration spec.\n      # See a newer release for the available fields.`
	);

	function setTab(id: TabId) {
		activeTab = id;
		if (typeof window !== 'undefined') {
			window.history.replaceState(window.history.state, '', `#${id}`);
		}
	}

	async function install() {
		setTab('usage');
		await tick();
		const tab = document.getElementById('tab-usage') ?? document.getElementById('tabpanel-usage');
		tab?.scrollIntoView({ block: 'start' });
		tab?.focus({ preventScroll: true });
	}

	function onTabKeydown(e: KeyboardEvent) {
		const i = tabs.findIndex((t) => t.id === activeTab);
		if (e.key === 'ArrowRight') setTab(tabs[(i + 1) % tabs.length].id);
		else if (e.key === 'ArrowLeft') setTab(tabs[(i - 1 + tabs.length) % tabs.length].id);
		else if (e.key === 'Home') setTab(tabs[0].id);
		else if (e.key === 'End') setTab(tabs[tabs.length - 1].id);
		else return;
		e.preventDefault();
		(document.getElementById(`tab-${activeTab}`) as HTMLElement | null)?.focus();
	}

	/** Plugin metadata types ("string", "[]string") as the schema outline's columns. */
	function schemaColumns(schema: AssetSchema) {
		return schema.fields.map((f) => ({
			name: f.name,
			type: f.type.startsWith('[]') ? `array<${f.type.slice(2)}>` : f.type.replace(/^(.*)\[\]$/, 'array<$1>'),
			description: f.description || undefined
		}));
	}

	const INGEST_CMD = 'marmot ingest -c ingest.yaml';
</script>

<svelte:head>
	<title>{plugin.display_name}{isLatest ? '' : ` ${version.version}`} · Marmot Plugin Registry</title>
	<meta name="description" content={plugin.description} />
	<meta property="og:title" content="{plugin.display_name} · Marmot Plugin Registry" />
	<meta property="og:description" content={plugin.description} />
	<meta property="og:url" content="{SITE_URL}/{plugin.namespace}/{plugin.name}" />
</svelte:head>

<!-- Header ----------------------------------------------------------------- -->
<mm-page-header heading={plugin.display_name}>
	<!-- The plugin ID is not an MRN, so it sits here with its own copy button rather than in the MRN line. -->
	<div slot="description" class="intro">
		<p class="id">
			<span class="mm-mono">{pluginId}</span>
			<mm-copy-button value={pluginId} label="Copy plugin ID" icon-only size="sm"></mm-copy-button>
		</p>
		<p class="description">{plugin.description}</p>
	</div>
	<mm-breadcrumbs slot="breadcrumbs">
		<mm-breadcrumb href="{base}/">Registry</mm-breadcrumb>
		{#if category}
			<mm-breadcrumb href="{base}/?category={category.id}">{category.label}</mm-breadcrumb>
		{/if}
		<mm-breadcrumb>{plugin.display_name}</mm-breadcrumb>
	</mm-breadcrumbs>
	<span slot="leading" class="leading"><PluginIcon iconName={plugin.icon} size={40} /></span>
	<span slot="heading" class="heading">
		{plugin.display_name}
		{#if plugin.official}<mm-icon name="verified" size={24} label="Maintained by Marmot"></mm-icon>{/if}
	</span>
	<span slot="tags" class="tags">
		{#if category}<span class="mm-tag"><mm-icon name={category.icon} size={14}></mm-icon>{category.label}</span>{/if}
		{#each features as f (f.name)}
			<span class="mm-tag"><mm-icon name={f.icon} size={14}></mm-icon>{f.name}</span>
		{/each}
		{#if status}
			<mm-status-pill status={status.tone} icon={status.icon}>{status.label}</mm-status-pill>
		{/if}
		{#if version.marmot_version}
			<span class="mm-tag" title="The Marmot releases this version works with"
				><mm-icon name="extension" size={14}></mm-icon>Marmot {version.marmot_version}</span
			>
		{/if}
		{#if advisories.length > 0}
			<mm-status-pill status="danger" icon="shield">Security advisory</mm-status-pill>
		{/if}
		{#if version.yanked}
			<mm-status-pill status="warning" icon="block">Yanked</mm-status-pill>
		{/if}
	</span>
	{#if plugin.versions.length > 1}
		<mm-select slot="actions" class="version" label="Version" hide-label value={version.version} onchange={onVersionChange}>
			{#each plugin.versions.slice().reverse() as v (v.version)}
				<mm-option value={v.version}
					>Version {v.version}{v === latest ? ' (latest)' : ''}{v.yanked ? ' (yanked)' : ''}{v.advisories?.length
						? ' (security advisory)'
						: ''}</mm-option
				>
			{/each}
		</mm-select>
	{/if}
	{#if plugin.source}
		<mm-button slot="actions" href={plugin.source} target="_blank">
			<mm-provider-logo slot="icon" provider="github" size={16} decorative></mm-provider-logo>
			Source<span class="mm-visually-hidden"> (opens in a new tab)</span>
		</mm-button>
	{/if}
	<mm-button slot="actions" variant="primary" icon="download" onclick={install}>Install</mm-button>
</mm-page-header>

{#each advisories as advisory (advisory.id)}
	<mm-callout class="notice" tone="danger" heading="{severityLabel(advisory.severity)} security advisory {advisory.id}">
		{advisory.summary} Fixed in version {advisory.fixed}. Marmot moves plugins off affected versions automatically
		unless auto-update is turned off or the plugin is pinned.
		<mm-button slot="actions" size="sm" variant="primary" href={fixedHref(advisory.fixed)}>View {advisory.fixed}</mm-button>
		{#if advisory.url}
			<mm-link slot="actions" href={advisory.url} external>Read the advisory</mm-link>
		{/if}
	</mm-callout>
{/each}

{#if version.yanked}
	<mm-callout class="notice" tone="warning" heading="This version has been yanked">
		{version.yanked_reason ?? 'It is no longer offered for installation.'} Marmot never installs a yanked version, though
		an install already running it keeps it until it moves.
	</mm-callout>
{/if}

{#if !isLatest && latest}
	<mm-callout class="notice" tone="warning" heading="This is an older version">
		Its configuration and docs may differ from the latest release.
		<mm-button slot="actions" size="sm" href={pluginHref}>View latest</mm-button>
	</mm-callout>
{/if}

{#if !hasDocs}
	<mm-callout class="notice" tone="info" heading="No docs were published for this version">
		It installs like any other release. See a newer version for configuration details.
	</mm-callout>
{/if}

<div class="layout">
	<div class="main">
		<!-- Tabs -------------------------------------------------------------- -->
		{#if tabs.length > 1}
			<div class="mm-tabs tabs" role="tablist" tabindex="-1" aria-label="Plugin sections" onkeydown={onTabKeydown}>
				{#each tabs as tab (tab.id)}
					{@const active = activeTab === tab.id}
					<button
						type="button"
						class="mm-tab"
						role="tab"
						aria-selected={active}
						aria-controls="tabpanel-{tab.id}"
						id="tab-{tab.id}"
						tabindex={active ? 0 : -1}
						onclick={() => setTab(tab.id)}
					>
						<mm-icon name={tab.icon}></mm-icon>
						{tab.label}
						{#if tab.count !== null}<span class="mm-tab__count">{tab.count}</span>{/if}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Overview ---------------------------------------------------------- -->
		{#if docsHtml}
			<div
				role="tabpanel"
				id="tabpanel-overview"
				aria-labelledby="tab-overview"
				hidden={activeTab !== 'overview'}
				class="mm-prose"
			>
				{@html docsHtml}
			</div>
		{/if}

		<!-- Usage ------------------------------------------------------------- -->
		<div
			role="tabpanel"
			id="tabpanel-usage"
			aria-labelledby={tabs.length > 1 ? 'tab-usage' : undefined}
			aria-label={tabs.length > 1 ? undefined : 'Usage'}
			hidden={activeTab !== 'usage'}
			class="usage"
			tabindex="-1"
		>
			<div class="methods">
				<section class="mm-panel method" aria-labelledby="ui-heading">
					<div class="mm-panel__head">
						<mm-icon name="space-dashboard"></mm-icon>
						<h2 id="ui-heading" class="mm-panel__title">In the UI</h2>
					</div>
					<div class="mm-panel__body method-body">
						<p class="mm-caption">Point and click, no config file needed.</p>
						<ol class="steps">
							<li>Open <strong>Runs</strong> and choose <strong>Create pipeline</strong>.</li>
							<li>Pick <strong>{plugin.display_name}</strong> from the plugin list.</li>
							<li>Fill in the settings, set a schedule and save.</li>
						</ol>
						<mm-link class="guide" href="https://marmotdata.io/docs/Populating/UI" external>Read the UI guide</mm-link>
					</div>
				</section>

				<section class="mm-panel method" aria-labelledby="cli-heading">
					<div class="mm-panel__head">
						<mm-icon name="terminal"></mm-icon>
						<h2 id="cli-heading" class="mm-panel__title">With the CLI</h2>
					</div>
					<div class="mm-panel__body method-body">
						<p class="mm-caption">Save a YAML config, then run <code>marmot ingest</code>.</p>
						<mm-code-sample filename="ingest.yaml" language="yaml" code={yamlExample}></mm-code-sample>
						<mm-code-sample language="shell" code={INGEST_CMD}></mm-code-sample>
						<mm-link class="guide" href="https://marmotdata.io/docs/Populating/CLI" external>Read the CLI guide</mm-link>
					</div>
				</section>
			</div>

			<section class="alt" aria-labelledby="alt-heading">
				<h2 id="alt-heading" class="mm-heading-sm">Not using plugins? Other ways to populate Marmot</h2>
				<div class="alt-grid">
					{#each ALT_METHODS as method (method.href)}
						<a href={method.href} target="_blank" rel="noopener" class="alt-card">
							<PluginIcon iconName={method.icon} size={24} />
							<span class="alt-text">
								<span class="alt-name">{method.name}<span class="mm-visually-hidden"> (opens in a new tab)</span></span>
								<span class="mm-caption">{method.description}</span>
							</span>
							<mm-icon name="open-in-new" class="alt-indicator"></mm-icon>
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
				<div class="section-head">
					<div>
						<h2 class="mm-heading">Configuration</h2>
						<p class="mm-caption">Fields marked Required must be set.</p>
					</div>
					{#if visibleFields.length > 0}
						<mm-segmented-control
							label="Show configuration as"
							hide-label
							value={configView}
							onchange={(e: Event) =>
								(configView = (e.currentTarget as HTMLInputElement).value as 'fields' | 'yaml')}
						>
							<mm-segment value="fields">Fields</mm-segment>
							<mm-segment value="yaml">YAML</mm-segment>
						</mm-segmented-control>
					{/if}
				</div>

				{#if visibleFields.length === 0}
					<mm-empty-state
						compact
						heading="No configuration needed"
						description="Add this plugin to a pipeline and it runs with its defaults."
					></mm-empty-state>
				{:else if configView === 'fields'}
					<ul class="mm-panel config">
						{#each visibleFields as field (field.name)}
							<ConfigFieldRow {field} />
						{/each}
					</ul>
				{:else}
					<mm-code-sample filename="ingest.yaml" language="yaml" code={configYaml}></mm-code-sample>
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
				<div class="section-head">
					<div>
						<h2 class="mm-heading">Assets emitted</h2>
						<p class="mm-caption">Metadata this plugin attaches to each discovered asset.</p>
					</div>
				</div>
				<div class="schemas">
					{#each assetSchemas as schema (schema.struct_name)}
						<section aria-labelledby="schema-{schema.struct_name}" class="schema">
							<h3 id="schema-{schema.struct_name}" class="mm-heading-sm">{schema.display_name}</h3>
							{#if schema.description}<p class="mm-caption">{schema.description}</p>{/if}
							<mm-schema-table
								label="{schema.display_name} metadata"
								empty-text="This asset type carries no extra metadata."
								use:setProps={{ columns: schemaColumns(schema) }}
							></mm-schema-table>
						</section>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Sidebar ------------------------------------------------------------- -->
	<aside class="side" aria-label="Release details">
		<section class="mm-panel" aria-labelledby="release-heading">
			<div class="mm-panel__head">
				<h2 id="release-heading" class="mm-panel__title">{isLatest ? 'Latest release' : 'This release'}</h2>
				<span class="mm-dense mm-num">{version.version}</span>
			</div>
			<div class="mm-panel__body">
				<mm-description-list layout="stacked">
					<mm-description term="OCI reference" mono>
						<span class="copyable">
							<span class="value">{version.oci_ref}</span>
							<mm-copy-button value={version.oci_ref} label="Copy OCI reference" icon-only size="sm"></mm-copy-button>
						</span>
					</mm-description>
					<mm-description term="Digest" mono>
						<span class="copyable">
							<span class="value">{version.digest}</span>
							<mm-copy-button value={version.digest} label="Copy digest" icon-only size="sm"></mm-copy-button>
						</span>
					</mm-description>
				</mm-description-list>
			</div>
		</section>

		<section class="mm-panel" aria-labelledby="about-heading">
			<div class="mm-panel__head">
				<h2 id="about-heading" class="mm-panel__title">About</h2>
			</div>
			<div class="mm-panel__body">
				<mm-description-list>
					<mm-description term="Maintainer">{plugin.official ? 'Marmot' : 'Community'}</mm-description>
					{#if category}
						<mm-description term="Category">
							<mm-link quiet href="{base}/?category={category.id}">{category.label}</mm-link>
						</mm-description>
					{/if}
					{#if status}
						<mm-description term="Status">{status.description || status.label}</mm-description>
					{/if}
					{#if features.length > 0}
						<mm-description term="Capabilities">
							{#each features as f, i (f.name)}<mm-link quiet href="{base}/?feature={encodeURIComponent(f.name)}"
									>{f.name}</mm-link
								>{i < features.length - 1 ? ', ' : ''}{/each}
						</mm-description>
					{/if}
				</mm-description-list>
			</div>
		</section>

		<section class="mm-panel" aria-labelledby="versions-heading">
			<div class="mm-panel__head">
				<h2 id="versions-heading" class="mm-panel__title">Versions</h2>
				<mm-count value={plugin.versions.length}></mm-count>
			</div>
			<mm-list dense>
				{#each plugin.versions.slice().reverse() as v (v.version)}
					<mm-list-item href={versionHref(v)} selected={v.version === version.version}>
						{v.version}
						<span slot="end" class="version-end">
							{#if v === latest}<span class="mm-caption">Latest</span>{/if}
							<mm-copy-button value={v.oci_ref} label="Copy OCI reference for {v.version}" icon-only size="sm"
							></mm-copy-button>
						</span>
					</mm-list-item>
				{/each}
			</mm-list>
		</section>
	</aside>
</div>

<style>
	.heading {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.heading mm-icon {
		color: var(--mm-text-2);
	}
	.leading {
		display: inline-grid;
		place-items: center;
		inline-size: 56px;
		block-size: 56px;
		background: var(--mm-surface);
		border: 1px solid var(--mm-rule);
		border-radius: var(--radius-md);
	}
	.intro {
		display: grid;
		gap: var(--space-2);
	}
	.intro p {
		margin: 0;
	}
	.id {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--mm-text-2);
	}
	.description {
		max-inline-size: 72ch;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}
	.version {
		inline-size: 13rem;
	}
	.notice {
		display: block;
		margin-block-start: var(--space-6);
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 20rem;
		gap: var(--space-8);
		align-items: start;
		margin-block-start: var(--space-8);
	}
	.tabs {
		margin-block-end: var(--space-6);
		overflow-x: auto;
	}
	.mm-prose {
		max-inline-size: 80ch;
	}
	.usage:focus {
		outline: none;
	}

	.methods {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-4);
		align-items: stretch;
	}
	.method {
		display: flex;
		flex-direction: column;
	}
	.method-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--space-3);
	}
	.method-body p {
		margin: 0;
	}
	.guide {
		margin-block-start: auto;
		padding-block-start: var(--space-2);
	}
	.steps {
		margin: 0;
		padding-inline-start: var(--space-5);
		font: var(--text-dense);
		color: var(--mm-text-2);
	}
	.steps li + li {
		margin-block-start: var(--space-2);
	}
	.steps strong {
		color: var(--mm-text);
		font-weight: 600;
	}

	.alt {
		margin-block-start: var(--space-8);
	}
	.alt h2 {
		margin: 0 0 var(--space-3);
	}
	.alt-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
	}
	.alt-card {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--mm-surface);
		border: 1px solid var(--mm-rule);
		border-radius: var(--radius-md);
		color: var(--mm-text);
		text-decoration: none;
		transition: border-color var(--mm-dur-press) var(--mm-ease);
	}
	.alt-card:hover {
		border-color: var(--mm-control-border);
	}
	.alt-card:hover .alt-name {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.alt-text {
		display: grid;
		gap: 2px;
		flex: 1;
		min-inline-size: 0;
	}
	.alt-name {
		font: var(--text-label);
		color: var(--mm-text);
	}
	.alt-indicator {
		color: var(--mm-text-3);
	}

	.section-head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-3);
		margin-block-end: var(--space-4);
	}
	.section-head h2,
	.section-head p {
		margin: 0;
	}
	.section-head p {
		margin-block-start: var(--space-1);
	}
	.config {
		margin: 0;
		padding: 0 var(--space-4);
		list-style: none;
	}
	.schemas {
		display: grid;
		gap: var(--space-8);
	}
	.schema {
		display: grid;
		gap: var(--space-2);
	}
	.schema h3,
	.schema p {
		margin: 0;
	}

	.side {
		position: sticky;
		inset-block-start: calc(var(--mm-control) + var(--space-8));
		display: grid;
		gap: var(--space-4);
	}
	.side .mm-panel__head {
		justify-content: space-between;
	}
	.side mm-list {
		--mm-list-inset: var(--space-4);
	}
	.copyable {
		display: flex;
		align-items: start;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	.copyable .value {
		flex: 1;
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.version-end {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	@media (max-width: 1100px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
		.side {
			position: static;
		}
	}
	@media (max-width: 880px) {
		.methods,
		.alt-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>

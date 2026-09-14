// Shared loader for /{namespace}/{name} (latest) and /{namespace}/{name}/v/{version}.
// Metadata and rendered docs live under static/, one file per version, written
// by pull-plugin-artifacts.mjs and render-docs.mjs.

import { error } from '@sveltejs/kit';
import { asset } from '$app/paths';
import type { Plugin, PluginMeta, PluginVersion } from '$lib/types';

export interface PluginPageData {
	plugin: Plugin;
	/** The version being viewed. */
	version: PluginVersion;
	isLatest: boolean;
	meta: PluginMeta | null;
	docsHtml: string | null;
}

type Fetch = typeof globalThis.fetch;

export async function loadPluginPage(
	fetch: Fetch,
	plugins: Plugin[],
	params: { namespace: string; name: string; version?: string }
): Promise<PluginPageData> {
	const plugin = plugins.find((p) => p.namespace === params.namespace && p.name === params.name);
	if (!plugin) throw error(404, `Plugin ${params.namespace}/${params.name} not found`);

	const latest = plugin.versions.at(-1);
	if (!latest) throw error(404, `Plugin ${params.namespace}/${params.name} has no versions`);

	const version = params.version
		? plugin.versions.find((v) => v.version === params.version)
		: latest;
	if (!version) {
		throw error(404, `${params.namespace}/${params.name} has no version ${params.version}`);
	}

	// Latest is also written unsuffixed; prefer the explicit file so both routes
	// agree byte for byte.
	const base = `${plugin.namespace}/${plugin.name}@${version.version}`;

	let meta: PluginMeta | null = null;
	try {
		const res = await fetch(asset(`/metadata/${base}.json`));
		if (res.ok) meta = (await res.json()) as PluginMeta;
	} catch {
		// Versions published before docs were attached have no metadata.
	}

	let docsHtml: string | null = null;
	try {
		const res = await fetch(asset(`/docs/${base}.html`));
		if (res.ok) docsHtml = await res.text();
	} catch {
		// Same as above.
	}

	return { plugin, version, isLatest: version === latest, meta, docsHtml };
}

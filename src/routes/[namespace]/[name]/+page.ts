import { error } from '@sveltejs/kit';
import { asset } from '$app/paths';
import type { PageLoad } from './$types';
import type { PluginMeta } from '$lib/types';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { plugins } = await parent();
	const plugin = plugins.find(
		(p) => p.namespace === params.namespace && p.name === params.name
	);
	if (!plugin) throw error(404, `Plugin ${params.namespace}/${params.name} not found`);

	let meta: PluginMeta | null = null;
	try {
		const res = await fetch(asset(`/metadata/${plugin.namespace}/${plugin.name}.json`));
		if (res.ok) meta = (await res.json()) as PluginMeta;
	} catch {
		// missing metadata is fine — page still renders without config detail
	}

	let docsHtml: string | null = null;
	try {
		const res = await fetch(asset(`/docs/${plugin.namespace}/${plugin.name}.html`));
		if (res.ok) docsHtml = await res.text();
	} catch {
		// missing docs is fine — Overview tab is hidden if there's nothing to show
	}

	return { plugin, meta, docsHtml };
};

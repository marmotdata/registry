import type { EntryGenerator, PageLoad } from './$types';
import { loadPluginPage } from '$lib/plugin-page';
import index from '../../../../../../static/plugins.json';

// Prerender a page for every published version. The sidebar links would let
// the crawler find them anyway; listing them here keeps the build complete
// even for a version nothing links to.
export const entries: EntryGenerator = () =>
	index.plugins.flatMap((p) =>
		p.versions.map((v) => ({ namespace: p.namespace, name: p.name, version: v.version }))
	);

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { plugins } = await parent();
	return loadPluginPage(fetch, plugins, params);
};

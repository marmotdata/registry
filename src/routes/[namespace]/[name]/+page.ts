import type { EntryGenerator, PageLoad } from './$types';
import { loadPluginPage } from '$lib/plugin-page';
import index from '../../../../static/plugins.json';

// Prerender every plugin explicitly. The registry links to plugins from mm-list-item rows, whose
// anchors live in shadow DOM where the prerender crawler can't see them.
export const entries: EntryGenerator = () =>
	index.plugins.map((p) => ({ namespace: p.namespace, name: p.name }));

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { plugins } = await parent();
	return loadPluginPage(fetch, plugins, params);
};

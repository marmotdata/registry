import type { PageLoad } from './$types';
import { loadPluginPage } from '$lib/plugin-page';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { plugins } = await parent();
	return loadPluginPage(fetch, plugins, params);
};

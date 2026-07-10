import type { LayoutLoad } from './$types';
import type { PluginIndex } from '$lib/types';

export const prerender = true;
export const trailingSlash = 'never';

export const load: LayoutLoad = async ({ fetch }) => {
	const res = await fetch('/plugins.json');
	if (!res.ok) throw new Error(`Failed to load plugins.json: ${res.status}`);
	const data: PluginIndex = await res.json();
	return {
		plugins: data.plugins,
		pluginCount: data.plugin_count,
		schemaVersion: data.schema_version
	};
};

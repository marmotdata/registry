import { asset } from '$app/paths';
import type { LayoutLoad } from './$types';
import type { PluginIndex, SecretStoreIndex } from '$lib/types';

export const prerender = true;
export const trailingSlash = 'never';

export const load: LayoutLoad = async ({ fetch }) => {
	const res = await fetch(asset('/plugins.json'));
	if (!res.ok) throw new Error(`Failed to load plugins.json: ${res.status}`);
	const data: PluginIndex = await res.json();

	const storesRes = await fetch(asset('/secret-stores.json'));
	if (!storesRes.ok) throw new Error(`Failed to load secret-stores.json: ${storesRes.status}`);
	const stores: SecretStoreIndex = await storesRes.json();

	return {
		plugins: data.plugins,
		pluginCount: data.plugin_count,
		schemaVersion: data.schema_version,
		secretStores: stores.secret_stores
	};
};

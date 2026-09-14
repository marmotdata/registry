// Reads plugins.yaml and emits plugins.json — the JSON is what external apps
// consume. Keep it deterministic so it produces clean diffs.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { load } from 'js-yaml';

const here = dirname(fileURLToPath(import.meta.url));
const yamlPath = resolve(here, '..', 'plugins.yaml');
const jsonPath = resolve(here, '..', 'static', 'plugins.json');
const storesYamlPath = resolve(here, '..', 'secret-stores.yaml');
const storesJsonPath = resolve(here, '..', 'static', 'secret-stores.json');

const src = load(readFileSync(yamlPath, 'utf8'));

if (!src || typeof src !== 'object') {
	throw new Error('plugins.yaml did not parse to an object');
}
if (!Array.isArray(src.plugins)) {
	throw new Error('plugins.yaml is missing a `plugins` array');
}

const defaultRegistry = src.default_registry;

function resolveOci(plugin, version) {
	if (version.oci_ref) return version.oci_ref;
	const base = plugin.oci ?? (defaultRegistry ? `${defaultRegistry}/${plugin.name}` : null);
	if (!base) {
		throw new Error(
			`plugin ${plugin.namespace}/${plugin.name} has no oci and no default_registry`
		);
	}
	return `${base}:${version.version}`;
}

const plugins = src.plugins.map((p) => {
	const versions = (p.versions ?? []).map((v) => ({
		version: v.version,
		digest: v.digest,
		oci_ref: resolveOci(p, v)
	}));
	return {
		namespace: p.namespace,
		name: p.name,
		display_name: p.display_name ?? p.name,
		description: p.description ?? '',
		icon: p.icon ?? p.name,
		category: p.category ?? null,
		status: p.status ?? null,
		features: p.features ?? [],
		official: p.official === true,
		source: p.source ?? null,
		latest_version: versions.at(-1)?.version ?? null,
		versions
	};
});

plugins.sort((a, b) => {
	if (a.namespace !== b.namespace) return a.namespace.localeCompare(b.namespace);
	return a.name.localeCompare(b.name);
});

const output = {
	schema_version: src.schema_version ?? 1,
	plugin_count: plugins.length,
	plugins
};

writeFileSync(jsonPath, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${plugins.length} plugins to ${jsonPath}`);

// Secret stores: a flat list, no versions, no OCI. See secret-stores.yaml.
const storesSrc = load(readFileSync(storesYamlPath, 'utf8'));
if (!storesSrc || !Array.isArray(storesSrc.secret_stores)) {
	throw new Error('secret-stores.yaml is missing a `secret_stores` array');
}
const secretStores = storesSrc.secret_stores
	.map((s) => ({
		id: s.id,
		display_name: s.display_name ?? s.id,
		description: s.description ?? '',
		icon: s.icon ?? s.id,
		status: s.status ?? null,
		federation: s.federation ?? null
	}))
	.sort((a, b) => a.display_name.localeCompare(b.display_name));

writeFileSync(
	storesJsonPath,
	JSON.stringify(
		{ schema_version: storesSrc.schema_version ?? 1, secret_store_count: secretStores.length, secret_stores: secretStores },
		null,
		2
	) + '\n'
);
console.log(`Wrote ${secretStores.length} secret stores to ${storesJsonPath}`);

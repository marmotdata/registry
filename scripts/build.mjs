// Reads plugins.yaml and emits plugins.json — the JSON is what external apps
// consume. Keep it deterministic so it produces clean diffs.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { load } from 'js-yaml';

const here = dirname(fileURLToPath(import.meta.url));
const yamlPath = resolve(here, '..', 'plugins.yaml');
const jsonPath = resolve(here, '..', 'static', 'plugins.json');

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

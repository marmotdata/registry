// Builds static/index.json, the plugin index running Marmots read to offer plugin updates
// without a Marmot upgrade: every published version of each core plugin, the Marmot releases
// each supports, yanked versions and security advisories. plugins.yaml is the source of truth;
// sign-index.mjs signs the result, and Marmot only trusts it once that signature verifies
// against a key built into the Marmot binary.
//
// Usage:
//   node scripts/build-index.mjs
//   PLUGIN_INDEX_TTL_DAYS=14 node scripts/build-index.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { load } from 'js-yaml';
import { constraint } from './semver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const yamlPath = resolve(root, 'plugins.yaml');
const indexPath = resolve(root, 'static', 'index.json');

// The index is republished daily, well inside this, so a captured copy can only be replayed
// to hide newer advisories for a bounded time.
const ttlDays = Number(process.env.PLUGIN_INDEX_TTL_DAYS ?? 14);

const SEVERITIES = new Set(['low', 'moderate', 'high', 'critical']);
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

const src = load(readFileSync(yamlPath, 'utf8'));
if (!Array.isArray(src?.plugins)) {
	throw new Error('plugins.yaml is missing a `plugins` array');
}

const now = new Date();
const index = {
	// Seconds since the epoch keep the version rising between builds without any state;
	// Marmot refuses an index older than one it has already seen.
	version: Math.floor(now.getTime() / 1000),
	generated: now.toISOString(),
	expires: new Date(now.getTime() + ttlDays * 86400_000).toISOString(),
	plugins: {}
};

// Only core plugins are in the index: they are the ones Marmot pins, and their names are
// reserved, so a community plugin can never stand in for one.
const core = src.plugins
	.filter((p) => p.official === true && p.namespace === 'marmotdata')
	.sort((a, b) => a.name.localeCompare(b.name));

for (const plugin of core) {
	const label = `${plugin.namespace}/${plugin.name}`;
	const versions = [...(plugin.versions ?? [])]
		.map((v) => ({ ...v, version: String(v.version) }))
		.sort((a, b) => cmpSemver(a.version, b.version));

	let previous = null;
	const out = versions.map((v) => {
		if (!SEMVER_RE.test(v.version)) throw new Error(`${label}: version ${v.version} is not semver`);
		if (!/^sha256:[a-f0-9]{64}$/.test(v.digest ?? '')) {
			throw new Error(`${label}@${v.version}: digest must be sha256:<64 hex>`);
		}
		const entry = {
			version: v.version,
			digest: v.digest,
			...(v.marmot_version ? { marmot_version: String(v.marmot_version) } : {}),
			...(v.protocol_version ? { protocol_version: Number(v.protocol_version) } : {}),
			...(v.released ? { released: new Date(v.released).toISOString() } : {}),
			changelog_url: changelogUrl(plugin, previous, v.version),
			...(v.yanked ? { yanked: true } : {}),
			...(v.yanked_reason ? { yanked_reason: v.yanked_reason } : {})
		};
		previous = v.version;
		return entry;
	});
	if (out.length === 0) continue;

	const advisories = (plugin.advisories ?? []).map((a) => {
		for (const field of ['id', 'severity', 'affected', 'fixed', 'summary']) {
			if (!a[field]) throw new Error(`${label}: advisory is missing ${field}`);
		}
		if (!SEVERITIES.has(a.severity)) {
			throw new Error(
				`${label}: advisory ${a.id} severity must be low, moderate, high or critical`
			);
		}
		// The registry pages evaluate this too, so it must be a form both sides understand.
		const affects = constraint(a.affected);
		if (affects(String(a.fixed))) {
			throw new Error(`${label}: advisory ${a.id} says its fixed version ${a.fixed} is affected`);
		}
		// An advisory is only published once its fix is, so Marmot always has somewhere to move to.
		if (!out.some((v) => v.version === String(a.fixed))) {
			throw new Error(
				`${label}: advisory ${a.id} names fixed version ${a.fixed}, which is not published`
			);
		}
		return {
			id: a.id,
			severity: a.severity,
			affected: String(a.affected),
			fixed: String(a.fixed),
			summary: a.summary,
			...(a.url ? { url: a.url } : {}),
			...(a.published ? { published: new Date(a.published).toISOString() } : {})
		};
	});

	index.plugins[plugin.name] = {
		versions: out,
		...(advisories.length ? { advisories } : {})
	};
}

writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
const advisoryCount = Object.values(index.plugins).reduce(
	(n, p) => n + (p.advisories?.length ?? 0),
	0
);
console.log(
	`Wrote index ${index.version} with ${Object.keys(index.plugins).length} plugins and ${advisoryCount} advisories to ${indexPath}`
);

function changelogUrl(plugin, previous, version) {
	const repo = 'https://github.com/marmotdata/marmot';
	const tag = `plugins/${plugin.name}/v${version}`;
	if (!previous) return `${repo}/tree/${tag}/plugins/${plugin.name}`;
	return `${repo}/compare/plugins/${plugin.name}/v${previous}...${tag}`;
}

function cmpSemver(a, b) {
	const pa = a.match(SEMVER_RE)?.slice(1).map(Number) ?? [0, 0, 0];
	const pb = b.match(SEMVER_RE)?.slice(1).map(Number) ?? [0, 0, 0];
	return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
}

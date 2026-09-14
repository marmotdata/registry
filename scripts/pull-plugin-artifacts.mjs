// Pulls the info referrer of every published version of every plugin and
// writes, per version:
//   static/metadata/{namespace}/{name}@{version}.json  (metadata + asset_schemas)
//   build/plugin-docs/{namespace}/{name}@{version}.md  (README, rendered later)
// plus an unsuffixed copy of the latest version at {name}.json / {name}.md.
//
// The referrer is attached by the release-plugin workflow in marmotdata/marmot
// (`oras attach` on the version's index digest). Versions pushed before that
// step existed have none; they are logged and skipped, and their pages render
// without docs.
//
// Usage: pnpm pull-plugin-artifacts [-- --only=name1,name2]

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { load } from 'js-yaml';

const INFO_TYPE = 'application/vnd.marmot.plugin.info.v1+json';
const README_TYPE = 'application/vnd.marmot.plugin.readme.v1+markdown';
const METADATA_TYPE = 'application/vnd.marmot.plugin.metadata.v1+json';
const SCHEMAS_TYPE = 'application/vnd.marmot.plugin.asset-schemas.v1+json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metaOut = resolve(root, 'static', 'metadata');
const docsOut = resolve(root, 'build', 'plugin-docs');

class OciClient {
	constructor(host, repo) {
		this.base = `https://${host}/v2/${repo}`;
		this.token = process.env.REGISTRY_TOKEN || null;
	}

	async findInfoReferrer(subjectDigest) {
		// GHCR returns 404 on /referrers/, so fall back to the referrers
		// tag schema (subject sha256:xxx → tag sha256-xxx).
		let res = await this.request(
			`${this.base}/referrers/${subjectDigest}?artifactType=${encodeURIComponent(INFO_TYPE)}`,
			'application/vnd.oci.image.index.v1+json'
		);
		if (res.status === 404) {
			res = await this.request(
				`${this.base}/manifests/${subjectDigest.replace(':', '-')}`,
				'application/vnd.oci.image.index.v1+json'
			);
			if (res.status === 404) return null;
		}
		if (!res.ok) throw new Error(`referrers ${res.status}: ${(await res.text()).slice(0, 200)}`);
		const idx = await res.json();
		// The artifactType filter is advisory per spec; re-filter locally.
		return (idx.manifests ?? []).find((m) => m.artifactType === INFO_TYPE)?.digest ?? null;
	}

	async getManifest(digest) {
		const res = await this.request(
			`${this.base}/manifests/${digest}`,
			'application/vnd.oci.image.manifest.v1+json'
		);
		if (!res.ok) throw new Error(`manifest ${digest.slice(0, 19)}: ${res.status}`);
		return res.json();
	}

	async getBlob(digest) {
		const res = await this.request(`${this.base}/blobs/${digest}`);
		if (!res.ok) throw new Error(`blob ${digest.slice(0, 19)}: ${res.status}`);
		return Buffer.from(await res.arrayBuffer());
	}

	async request(url, accept) {
		const headers = { Accept: accept ?? '*/*' };
		if (this.token) headers.Authorization = `Bearer ${this.token}`;
		let res = await fetch(url, { headers });
		if (res.status === 401 && !this.token) {
			this.token = await this.anonToken(res.headers.get('www-authenticate'));
			headers.Authorization = `Bearer ${this.token}`;
			res = await fetch(url, { headers });
		}
		return res;
	}

	async anonToken(wwwAuth) {
		if (!wwwAuth?.startsWith('Bearer ')) throw new Error(`unexpected 401: ${wwwAuth}`);
		const params = {};
		for (const p of wwwAuth.slice(7).split(',')) {
			const [k, v] = p.trim().split('=');
			params[k] = v.replace(/^"|"$/g, '');
		}
		const url = new URL(params.realm);
		if (params.service) url.searchParams.set('service', params.service);
		if (params.scope) url.searchParams.set('scope', params.scope);
		const res = await fetch(url);
		if (!res.ok) throw new Error(`token ${res.status}`);
		const body = await res.json();
		return body.token ?? body.access_token;
	}
}

async function pullInfoBundle(repoRef, subjectDigest) {
	const slash = repoRef.indexOf('/');
	const client = new OciClient(repoRef.slice(0, slash), repoRef.slice(slash + 1));
	const infoDigest = await client.findInfoReferrer(subjectDigest);
	if (!infoDigest) throw new Error('no info referrer (published before docs were attached)');
	const manifest = await client.getManifest(infoDigest);
	const bundle = {};
	for (const layer of manifest.layers ?? []) {
		bundle[layer.mediaType] = await client.getBlob(layer.digest);
	}
	return bundle;
}

// `names` is every basename to write under: [`kafka@0.1.2`] for an old
// version, [`kafka@0.1.2`, `kafka`] for the latest.
function writeBundle(plugin, bundle, names) {
	if (bundle[METADATA_TYPE]) {
		const meta = JSON.parse(bundle[METADATA_TYPE].toString('utf8'));
		if (bundle[SCHEMAS_TYPE]) {
			meta.asset_schemas = JSON.parse(bundle[SCHEMAS_TYPE].toString('utf8'));
		}
		const dir = join(metaOut, plugin.namespace);
		mkdirSync(dir, { recursive: true });
		const json = JSON.stringify(meta, null, 2) + '\n';
		for (const n of names) writeFileSync(join(dir, `${n}.json`), json);
	}
	if (bundle[README_TYPE]) {
		const dir = join(docsOut, plugin.namespace);
		mkdirSync(dir, { recursive: true });
		for (const n of names) writeFileSync(join(dir, `${n}.md`), bundle[README_TYPE]);
	}
}

function resolveRepoRef(plugin, version, defaultRegistry) {
	if (!version.oci_ref) return plugin.oci ?? `${defaultRegistry}/${plugin.name}`;
	// Strip only the trailing :tag, leaving any host :port intact.
	const lastColon = version.oci_ref.lastIndexOf(':');
	const lastSlash = version.oci_ref.lastIndexOf('/');
	return lastColon > lastSlash ? version.oci_ref.slice(0, lastColon) : version.oci_ref;
}

// --- main ---------------------------------------------------------

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

const index = load(readFileSync(resolve(root, 'plugins.yaml'), 'utf8'));
const plugins = index.plugins.filter((p) => !only || only.has(p.name));
if (plugins.length === 0) {
	console.error('No plugins matched.');
	process.exit(1);
}

if (!only) {
	rmSync(metaOut, { recursive: true, force: true });
	rmSync(docsOut, { recursive: true, force: true });
}
mkdirSync(metaOut, { recursive: true });
mkdirSync(docsOut, { recursive: true });

// One job per (plugin, version). GHCR tolerates a handful in flight.
const jobs = [];
for (const plugin of plugins) {
	const label = `${plugin.namespace}/${plugin.name}`;
	const versions = (plugin.versions ?? []).filter((v) => v?.digest);
	if (versions.length === 0) {
		jobs.push({ label, skip: 'no version/digest in plugins.yaml' });
		continue;
	}
	const latest = versions.at(-1);
	for (const version of versions) {
		const names = [`${plugin.name}@${version.version}`];
		if (version === latest) names.push(plugin.name);
		jobs.push({ label: `${label}@${version.version}`, plugin, version, names });
	}
}

const CONCURRENCY = 6;
const skipped = [];
let ok = 0;
let next = 0;

async function worker() {
	while (next < jobs.length) {
		const job = jobs[next++];
		if (job.skip) {
			skipped.push(`${job.label} — ${job.skip}`);
			continue;
		}
		try {
			const repo = resolveRepoRef(job.plugin, job.version, index.default_registry);
			const bundle = await pullInfoBundle(repo, job.version.digest);
			writeBundle(job.plugin, bundle, job.names);
			console.log(`  ok    ${job.label}`);
			ok++;
		} catch (err) {
			skipped.push(`${job.label} — ${err.message}`);
		}
	}
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\n${ok} pulled, ${skipped.length} skipped`);
for (const s of skipped.sort()) console.warn(`  skip  ${s}`);

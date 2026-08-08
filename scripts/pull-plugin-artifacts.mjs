// Pulls each plugin's info referrer from OCI and writes:
//   static/metadata/{namespace}/{name}.json    (metadata + asset_schemas)
//   build/plugin-docs/{namespace}/{name}.md    (README, later rendered to HTML)
//
// Missing referrers are logged and skipped so partially-released
// registries still build. Re-release with `marmot plugin push` to fix.
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
	if (!infoDigest) throw new Error('no info referrer (re-release with `marmot plugin push`)');
	const manifest = await client.getManifest(infoDigest);
	const bundle = {};
	for (const layer of manifest.layers ?? []) {
		bundle[layer.mediaType] = await client.getBlob(layer.digest);
	}
	return bundle;
}

function writeBundle(plugin, bundle) {
	if (bundle[METADATA_TYPE]) {
		const meta = JSON.parse(bundle[METADATA_TYPE].toString('utf8'));
		if (bundle[SCHEMAS_TYPE]) {
			meta.asset_schemas = JSON.parse(bundle[SCHEMAS_TYPE].toString('utf8'));
		}
		const dir = join(metaOut, plugin.namespace);
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, `${plugin.name}.json`), JSON.stringify(meta, null, 2) + '\n');
	}
	if (bundle[README_TYPE]) {
		const dir = join(docsOut, plugin.namespace);
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, `${plugin.name}.md`), bundle[README_TYPE]);
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

const skipped = [];
let ok = 0;
for (const plugin of plugins) {
	const label = `${plugin.namespace}/${plugin.name}`;
	const latest = plugin.versions?.at(-1);
	if (!latest?.digest) {
		skipped.push(`${label} — no version/digest in plugins.yaml`);
		continue;
	}
	try {
		const bundle = await pullInfoBundle(resolveRepoRef(plugin, latest, index.default_registry), latest.digest);
		writeBundle(plugin, bundle);
		console.log(`  ok    ${label}`);
		ok++;
	} catch (err) {
		skipped.push(`${label} — ${err.message}`);
	}
}

console.log(`\n${ok} pulled, ${skipped.length} skipped`);
for (const s of skipped) console.warn(`  skip  ${s}`);

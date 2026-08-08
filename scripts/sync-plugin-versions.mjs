// For each plugin in plugins.yaml, lists tags on GHCR, and for any semver
// tag not already listed fetches its index digest and appends a new
// version entry. Format-preserving edit (no YAML round-trip).
//
// Usage:
//   node scripts/sync-plugin-versions.mjs              # all plugins
//   node scripts/sync-plugin-versions.mjs --only kafka,s3

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { load } from 'js-yaml';

const INDEX_ACCEPT = [
	'application/vnd.oci.image.index.v1+json',
	'application/vnd.docker.distribution.manifest.list.v2+json',
	'application/vnd.oci.image.manifest.v1+json',
	'application/vnd.docker.distribution.manifest.v2+json'
].join(', ');

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;

class OciClient {
	constructor(host) {
		this.host = host;
		this.tokens = new Map();
	}
	async request(url, opts = {}) {
		const key = new URL(url).pathname.split('/manifests/')[0].split('/blobs/')[0].split('/tags/')[0];
		const headers = { ...(opts.headers || {}) };
		const token = this.tokens.get(key);
		if (token) headers.Authorization = `Bearer ${token}`;
		let res = await fetch(url, { ...opts, headers });
		if (res.status === 401 && !token) {
			const fresh = await anonToken(res.headers.get('www-authenticate'));
			this.tokens.set(key, fresh);
			headers.Authorization = `Bearer ${fresh}`;
			res = await fetch(url, { ...opts, headers });
		}
		return res;
	}
}

const clients = new Map();
function client(host) {
	if (!clients.has(host)) clients.set(host, new OciClient(host));
	return clients.get(host);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const yamlPath = resolve(root, 'plugins.yaml');

const args = process.argv.slice(2);
const onlyArg = flag('--only');
const only = onlyArg ? new Set(onlyArg.split(',')) : null;

const raw = readFileSync(yamlPath, 'utf8');
const index = load(raw);
const plugins = index.plugins.filter((p) => !only || only.has(p.name));

let out = raw;
const added = [];
const skipped = [];
const errors = [];

for (const plugin of plugins) {
	const label = `${plugin.namespace}/${plugin.name}`;
	const repo = plugin.oci ?? `${index.default_registry}/${plugin.name}`;
	const known = new Set((plugin.versions ?? []).map((v) => String(v.version)));
	let tags;
	try {
		tags = await listTags(repo);
	} catch (err) {
		errors.push(`${label} — ${err.message}`);
		continue;
	}
	const missing = tags
		.map((t) => t.replace(/^v/, ''))
		.filter((v) => SEMVER_RE.test(`v${v}`) && !known.has(v))
		.sort(cmpSemver);
	if (missing.length === 0) {
		skipped.push(`${label} — up to date (${tags.length} tag${tags.length === 1 ? '' : 's'})`);
		continue;
	}
	for (const version of missing) {
		try {
			const digest = await fetchDigest(repo, version);
			out = insertVersion(out, plugin, version, digest);
			added.push(`${label}@${version} → ${digest}`);
		} catch (err) {
			errors.push(`${label}@${version} — ${err.message}`);
		}
	}
}

if (added.length > 0) writeFileSync(yamlPath, out);

console.log(`${added.length} added, ${skipped.length} up-to-date, ${errors.length} errors`);
for (const a of added) console.log(`  add   ${a}`);
for (const s of skipped) console.log(`  ok    ${s}`);
for (const e of errors) console.warn(`  err   ${e}`);
if (errors.length > 0) process.exit(1);

function flag(name) {
	const hit = args.find((a) => a === name || a.startsWith(`${name}=`));
	if (!hit) return null;
	if (hit.includes('=')) return hit.slice(name.length + 1);
	return args[args.indexOf(hit) + 1] ?? null;
}

function cmpSemver(a, b) {
	const [, aM, am, ap] = a.match(SEMVER_RE);
	const [, bM, bm, bp] = b.match(SEMVER_RE);
	return Number(aM) - Number(bM) || Number(am) - Number(bm) || Number(ap) - Number(bp);
}

async function anonToken(wwwAuth) {
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

async function listTags(repoRef) {
	const slash = repoRef.indexOf('/');
	const host = repoRef.slice(0, slash);
	const repo = repoRef.slice(slash + 1);
	const tags = [];
	let url = `https://${host}/v2/${repo}/tags/list?n=100`;
	while (url) {
		const res = await client(host).request(url);
		if (res.status === 404) return [];
		if (!res.ok) throw new Error(`tags/list ${res.status}`);
		const body = await res.json();
		for (const t of body.tags ?? []) tags.push(t);
		const link = res.headers.get('link');
		const next = link?.match(/<([^>]+)>;\s*rel="next"/);
		url = next ? new URL(next[1], `https://${host}`).toString() : null;
	}
	return tags;
}

async function fetchDigest(repoRef, tag) {
	const slash = repoRef.indexOf('/');
	const host = repoRef.slice(0, slash);
	const repo = repoRef.slice(slash + 1);
	const url = `https://${host}/v2/${repo}/manifests/${tag}`;
	const res = await client(host).request(url, {
		method: 'HEAD',
		headers: { Accept: INDEX_ACCEPT }
	});
	if (res.status === 404) throw new Error(`tag ${tag} not found`);
	if (!res.ok) throw new Error(`manifest ${res.status}`);
	const digest = res.headers.get('docker-content-digest');
	if (!digest) throw new Error('no docker-content-digest header');
	return digest;
}

function insertVersion(source, plugin, version, digest) {
	const header = `  - namespace: ${plugin.namespace}\n    name: ${plugin.name}\n`;
	const start = source.indexOf(header);
	if (start === -1) throw new Error('plugin block not found in yaml');
	const nextStart = source.indexOf('\n  - namespace:', start + header.length);
	const blockEnd = nextStart === -1 ? source.length : nextStart + 1;
	const block = source.slice(start, blockEnd);
	const digestRe = /^ {8}digest: sha256:[a-f0-9]+\n/gm;
	const matches = [...block.matchAll(digestRe)];
	if (matches.length === 0) throw new Error('no existing digest line to anchor insertion');
	const last = matches[matches.length - 1];
	const insertAt = start + last.index + last[0].length;
	const insertion = `      - version: ${version}\n        digest: ${digest}\n`;
	return source.slice(0, insertAt) + insertion + source.slice(insertAt);
}

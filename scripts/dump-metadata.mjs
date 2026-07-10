// Runs `go run . --dump-metadata` in each core plugin's source dir and
// writes the resulting Meta JSON (name, description, features, config_spec, …)
// into static/metadata/{namespace}/{name}.json.
//
// This is interim. The plan is to have the marmot CLI bundle a metadata.json
// layer into the OCI artifact at publish time; then this script becomes an
// `oras pull` of that layer. UI code that consumes the JSON does not change.
//
// Usage:
//   pnpm dump-metadata                          # uses ~/Code/marmot
//   MARMOT_REPO=/path/to/marmot pnpm dump-metadata
//   pnpm dump-metadata -- --only=postgresql,gcs # subset

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { load } from 'js-yaml';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const marmotRepo = process.env.MARMOT_REPO ?? resolve(homedir(), 'Code', 'marmot');
const outputDir = resolve(root, 'static', 'metadata');

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

if (!existsSync(marmotRepo)) {
	console.error(`marmot repo not found at ${marmotRepo}. Set MARMOT_REPO to override.`);
	process.exit(1);
}

const index = load(readFileSync(resolve(root, 'plugins.yaml'), 'utf8'));
const plugins = index.plugins.filter(
	(p) => p.namespace === 'marmotdata' && (!only || only.has(p.name))
);

if (plugins.length === 0) {
	console.error('No plugins matched.');
	process.exit(1);
}

if (!only) {
	rmSync(outputDir, { recursive: true, force: true });
}
mkdirSync(outputDir, { recursive: true });

const results = { ok: [], failed: [] };

for (const plugin of plugins) {
	const label = `${plugin.namespace}/${plugin.name}`;
	const pluginDir = join(marmotRepo, 'plugins', plugin.name);

	if (!existsSync(pluginDir)) {
		console.warn(`  skip  ${label} — no source dir at ${pluginDir}`);
		results.failed.push({ plugin: label, reason: 'no source dir' });
		continue;
	}

	process.stdout.write(`  ...   ${label}\r`);
	const start = Date.now();
	const result = spawnSync('go', ['run', '.', '--dump-metadata'], {
		cwd: pluginDir,
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024
	});
	const took = ((Date.now() - start) / 1000).toFixed(1);

	if (result.error) {
		console.error(`  fail  ${label} — ${result.error.message}`);
		results.failed.push({ plugin: label, reason: result.error.message });
		continue;
	}
	if (result.status !== 0) {
		console.error(`  fail  ${label} (exit ${result.status}, ${took}s)`);
		console.error(indent(result.stderr.trim().split('\n').slice(-6).join('\n'), '        '));
		results.failed.push({ plugin: label, reason: `exit ${result.status}` });
		continue;
	}

	let meta;
	try {
		meta = JSON.parse(result.stdout);
	} catch {
		const match = result.stdout.match(/\{[\s\S]*\}/);
		if (!match) {
			console.error(`  fail  ${label} — no JSON in stdout`);
			results.failed.push({ plugin: label, reason: 'no JSON in stdout' });
			continue;
		}
		meta = JSON.parse(match[0]);
	}

	// Extract asset schemas from the plugin's *.go source. This is a stopgap
	// until pluginsdk.Meta exposes AssetTypes and --dump-metadata emits them.
	meta.asset_schemas = extractAssetSchemas(pluginDir, plugin.name, meta.name);

	const nsDir = join(outputDir, plugin.namespace);
	mkdirSync(nsDir, { recursive: true });
	writeFileSync(join(nsDir, `${plugin.name}.json`), JSON.stringify(meta, null, 2) + '\n');

	const configCount = countFields(meta.config_spec ?? []);
	const assetCount = meta.asset_schemas.length;
	console.log(
		`  ok    ${label}  (${configCount} config fields, ${assetCount} asset schemas, ${took}s)`
	);
	results.ok.push(label);
}

console.log(
	`\n${results.ok.length} of ${plugins.length} dumped → ${outputDir.replace(root + '/', '')}`
);
if (results.failed.length) {
	console.log('Failed:');
	for (const f of results.failed) console.log(`  - ${f.plugin}: ${f.reason}`);
	process.exit(1);
}

function countFields(fields) {
	return fields.reduce((n, f) => n + 1 + countFields(f.fields ?? []), 0);
}

function indent(s, pad) {
	return s
		.split('\n')
		.map((l) => pad + l)
		.join('\n');
}

// Walks every .go file under the plugin dir, finds top-level `type X Fields struct`
// declarations, and extracts fields tagged with `metadata:"..."`. The parser is
// deliberately tiny — full go/ast would be cleaner but the SDK convention is
// stable enough that regex-per-line works.
function extractAssetSchemas(pluginDir, pluginId, pluginName) {
	const schemas = [];
	const files = walkGoFiles(pluginDir);
	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		schemas.push(...parseAssetStructs(source, pluginId, pluginName));
	}
	// Deduplicate by struct name in case multiple files declare the same type.
	const seen = new Set();
	return schemas.filter((s) => {
		if (seen.has(s.struct_name)) return false;
		seen.add(s.struct_name);
		return true;
	});
}

function walkGoFiles(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'vendor' || entry.name === 'testdata') continue;
			out.push(...walkGoFiles(full));
		} else if (entry.name.endsWith('.go') && !entry.name.endsWith('_test.go')) {
			out.push(full);
		}
	}
	return out;
}

function parseAssetStructs(source, pluginId, pluginName) {
	const results = [];
	const lines = source.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const match = lines[i].match(/^type\s+(\w*Fields)\s+struct\s*\{/);
		if (!match) continue;
		const structName = match[1];

		// Grab the preceding doc comment, skipping `+marmot:...` directives.
		const commentLines = [];
		let j = i - 1;
		while (j >= 0 && /^\s*\/\//.test(lines[j])) {
			const text = lines[j].replace(/^\s*\/\/\s?/, '').trim();
			if (!text.startsWith('+')) commentLines.unshift(text);
			j--;
		}
		const description = commentLines.join(' ').trim();

		// Collect fields until the closing brace.
		const fields = [];
		let k = i + 1;
		while (k < lines.length && !lines[k].trim().startsWith('}')) {
			const fieldMatch = lines[k].match(/^\s*(\w+)\s+([^\s`]+)\s*`([^`]+)`/);
			if (fieldMatch) {
				const [, , goType, tag] = fieldMatch;
				const metadataName = extractTag(tag, 'metadata');
				if (metadataName) {
					fields.push({
						name: metadataName,
						type: normalizeGoType(goType),
						description: extractTag(tag, 'description') ?? ''
					});
				}
			}
			k++;
		}

		if (fields.length === 0) continue;

		results.push({
			struct_name: structName,
			display_name: normalizeAssetName(structName, pluginId, pluginName),
			description,
			fields
		});
	}
	return results;
}

function extractTag(tag, key) {
	const m = tag.match(new RegExp(`${key}:"([^"]+)"`));
	return m ? m[1] : null;
}

function normalizeGoType(goType) {
	let suffix = '';
	if (goType.startsWith('[]')) {
		suffix = '[]';
		goType = goType.slice(2);
	}
	if (goType.startsWith('*')) goType = goType.slice(1);
	const map = {
		string: 'string',
		bool: 'bool',
		int: 'int',
		int8: 'int',
		int16: 'int',
		int32: 'int',
		int64: 'int',
		uint: 'int',
		uint8: 'int',
		uint16: 'int',
		uint32: 'int',
		uint64: 'int',
		float32: 'float',
		float64: 'float'
	};
	return (map[goType] ?? goType) + suffix;
}

function normalizeAssetName(structName, pluginId, pluginName) {
	let n = structName.replace(/Fields$/, '');
	const prefixes = [pluginId, pluginName?.replace(/\s+/g, '')].filter(Boolean);
	for (const p of prefixes) {
		if (n.toLowerCase().startsWith(p.toLowerCase()) && n.length > p.length) {
			n = n.slice(p.length);
			break;
		}
	}
	// Split CamelCase → "Camel Case", handling acronyms.
	return n.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

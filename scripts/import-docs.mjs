// Copies plugin docs from the marmot repo's web/docs/docs/Plugins/ into this
// repo at docs/plugins/marmotdata/{name}.md, stripping Docusaurus-only JSX and
// redundant sections (Configuration and Available Metadata already live on
// dedicated tabs). The marmot repo is assumed to be a sibling checkout
// (../marmot); set MARMOT_REPO to point elsewhere.
//
// Usage:
//   pnpm import-docs
//   MARMOT_REPO=/path/to/marmot pnpm import-docs
//
// Once the marmot CLI bundles README.md into the OCI at publish time, this
// script becomes an `oras pull` of that layer with the same preprocessing.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { load } from 'js-yaml';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const marmotRepo = process.env.MARMOT_REPO ?? resolve(root, '..', 'marmot');
const docsSource = join(marmotRepo, 'web', 'docs', 'docs', 'Plugins');
const docsOut = resolve(root, 'docs', 'plugins', 'marmotdata');

if (!existsSync(docsSource)) {
	console.error(`Docs source not found at ${docsSource}. Set MARMOT_REPO to override.`);
	process.exit(1);
}

const index = load(readFileSync(resolve(root, 'plugins.yaml'), 'utf8'));
const plugins = index.plugins.filter((p) => p.namespace === 'marmotdata');

mkdirSync(docsOut, { recursive: true });

const files = readdirSync(docsSource).filter((f) => f.endsWith('.md') && f !== 'index.md');
const results = { ok: [], skipped: [] };

for (const plugin of plugins) {
	const match = findDocFile(files, plugin);
	if (!match) {
		results.skipped.push({
			plugin: `${plugin.namespace}/${plugin.name}`,
			reason: `no docs file matching "${plugin.display_name}"`
		});
		continue;
	}

	const raw = readFileSync(join(docsSource, match), 'utf8');
	const cleaned = preprocess(raw);
	writeFileSync(join(docsOut, `${plugin.name}.md`), cleaned);
	console.log(`  ok    ${plugin.namespace}/${plugin.name}  ← ${match}`);
	results.ok.push(`${plugin.namespace}/${plugin.name}`);
}

console.log(
	`\n${results.ok.length} of ${plugins.length} imported → ${docsOut.replace(root + '/', '')}`
);
if (results.skipped.length) {
	console.log('Skipped:');
	for (const s of results.skipped) console.log(`  - ${s.plugin}: ${s.reason}`);
}

function findDocFile(files, plugin) {
	const candidates = new Set([
		plugin.display_name,
		plugin.display_name.replace(/^(AWS|Apache|Google) /, ''),
		plugin.name,
		plugin.name.charAt(0).toUpperCase() + plugin.name.slice(1)
	]);
	for (const file of files) {
		const stem = file.slice(0, -3);
		for (const c of candidates) {
			if (stem.toLowerCase() === c.toLowerCase()) return file;
		}
	}
	return null;
}

function preprocess(source) {
	// Frontmatter → gone
	source = source.replace(/^---\n[\s\S]*?\n---\n/, '');
	// Leading H1 (redundant with the page title)
	source = source.replace(/^\s*# .+\n/, '');
	// Badge div block emitted by the docs template (Status + Creates chips)
	source = stripLeadingBadgeDiv(source);
	// Docusaurus imports
	source = source.replace(/^import\s+.+;\s*$/gm, '');
	// Custom Docusaurus components we can't render
	source = source.replace(/<CalloutCard[\s\S]*?\/>\s*/g, '');
	source = source.replace(/<CalloutCard[\s\S]*?<\/CalloutCard>\s*/g, '');
	source = source.replace(/<ThemedImg[\s\S]*?\/>\s*/g, '');
	source = source.replace(/<PluginCards\s*\/>\s*/g, '');
	source = source.replace(/<TipBox[\s\S]*?<\/TipBox>\s*/g, '');
	source = source.replace(/<CliInstall\s*\/>\s*/g, '');
	// Sections owned by dedicated tabs (or redundant with the Usage-tab YAML)
	source = stripSection(source, 'Configuration');
	source = stripSection(source, 'Available Metadata');
	source = stripSection(source, 'Example Configuration');
	// Tidy up
	return source.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function stripLeadingBadgeDiv(source) {
	const lines = source.split('\n');
	const startRe = /<div class="flex flex-col gap-3 mb-6 pb-6 border-b/;
	const start = lines.findIndex((l) => startRe.test(l));
	if (start === -1) return source;
	let depth = 0;
	for (let i = start; i < lines.length; i++) {
		depth += (lines[i].match(/<div\b/g) ?? []).length;
		depth -= (lines[i].match(/<\/div>/g) ?? []).length;
		if (depth === 0) {
			return lines.slice(0, start).concat(lines.slice(i + 1)).join('\n');
		}
	}
	return source;
}

function stripSection(source, heading) {
	const lines = source.split('\n');
	const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
	if (start === -1) return source;
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) {
		if (/^##\s/.test(lines[i])) {
			end = i;
			break;
		}
	}
	return lines.slice(0, start).concat(lines.slice(end)).join('\n');
}

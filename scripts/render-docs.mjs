// Renders plugin README markdown → static/docs/*/*.html so detail pages
// embed the HTML directly, keeping `marked` out of the client bundle.
//
// Input: build/plugin-docs/{namespace}/{name}.md, written by
// pull-plugin-artifacts.mjs. Plugin READMEs target the Docusaurus docs
// site (frontmatter + MDX imports + JSX components); sanitizeMdx()
// strips those bits so we can render plain markdown.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { marked } from 'marked';
import Prism from 'prismjs';

// Preload the languages the plugin docs use. Prism's language set is dynamic;
// import once at start and every subsequent Prism.highlight() sees them.
await import('prismjs/components/prism-bash.js');
await import('prismjs/components/prism-yaml.js');
await import('prismjs/components/prism-sql.js');
await import('prismjs/components/prism-json.js');
await import('prismjs/components/prism-ini.js');
await import('prismjs/components/prism-javascript.js');
await import('prismjs/components/prism-typescript.js');
await import('prismjs/components/prism-go.js');
await import('prismjs/components/prism-docker.js');
await import('prismjs/components/prism-hcl.js');

const LANG_ALIASES = { sh: 'bash', shell: 'bash' };

function escapeHtml(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

marked.use({
	renderer: {
		code({ text, lang }) {
			const canonical = LANG_ALIASES[lang] ?? lang ?? '';
			const grammar = Prism.languages[canonical];
			const html = grammar
				? Prism.highlight(text, grammar, canonical)
				: escapeHtml(text);
			const cls = canonical ? ` language-${canonical}` : '';
			return `<pre class="code-block${cls}"><code class="code-block${cls}">${html}</code></pre>\n`;
		}
	}
});

// Docusaurus-style admonitions: :::tip[Title]\n...body...\n:::
// Body is parsed as markdown so nested code blocks still get highlighted.
const ADMONITION_ICONS = {
	tip: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
	note: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v6h6"/></svg>',
	info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
	warning:
		'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
	caution:
		'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
	danger:
		'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 2 20h20L12 2Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
};

marked.use({
	extensions: [
		{
			name: 'admonition',
			level: 'block',
			start(src) {
				const m = src.match(/^:::(?:tip|note|info|warning|caution|danger)\b/m);
				return m?.index;
			},
			tokenizer(src) {
				const re = /^:::(tip|note|info|warning|caution|danger)(?:\[([^\]]*)\])?[ \t]*\n([\s\S]*?)^:::[ \t]*(?:\n|$)/m;
				const m = re.exec(src);
				if (!m || m.index !== 0) return;
				const type = m[1];
				const title = m[2] ?? type[0].toUpperCase() + type.slice(1);
				const body = m[3];
				return {
					type: 'admonition',
					raw: m[0],
					admType: type,
					title,
					tokens: this.lexer.blockTokens(body.trim(), [])
				};
			},
			renderer(token) {
				const body = this.parser.parse(token.tokens);
				const icon = ADMONITION_ICONS[token.admType] ?? '';
				return (
					`<div class="admonition admonition-${token.admType}">` +
					`<div class="admonition-heading">${icon}<span>${escapeHtml(token.title)}</span></div>` +
					`<div class="admonition-body">${body}</div>` +
					`</div>\n`
				);
			}
		}
	]
});

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const docsIn = resolve(root, 'build', 'plugin-docs');
const docsOut = resolve(root, 'static', 'docs');

if (!existsSync(docsIn)) {
	console.log(`No pulled docs at ${docsIn}. Run pull-plugin-artifacts first.`);
	process.exit(0);
}

rmSync(docsOut, { recursive: true, force: true });
mkdirSync(docsOut, { recursive: true });

marked.setOptions({ gfm: true, breaks: false });


let count = 0;
for (const namespace of readdirSync(docsIn, { withFileTypes: true })) {
	if (!namespace.isDirectory()) continue;
	const nsIn = join(docsIn, namespace.name);
	const nsOut = join(docsOut, namespace.name);
	mkdirSync(nsOut, { recursive: true });
	for (const file of readdirSync(nsIn)) {
		if (!file.endsWith('.md')) continue;
		const md = sanitizeMdx(readFileSync(join(nsIn, file), 'utf8'));
		const html = marked.parse(md);
		writeFileSync(join(nsOut, file.replace(/\.md$/, '.html')), html);
		count++;
	}
}

console.log(`Rendered ${count} doc${count === 1 ? '' : 's'} → ${docsOut.replace(root + '/', '')}`);

// Plugin READMEs target Docusaurus. Registry HTML can't run JSX or MDX
// imports, and duplicating our own status badges makes the page noisy.
// sanitizeMdx strips those bits so registry rendering stays plain
// markdown → HTML.
function sanitizeMdx(md) {
	let out = md;

	// YAML frontmatter at the top of the file.
	out = out.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

	// MDX-style imports: `import { X } from 'y';` on their own line.
	out = out.replace(/^import\s+[^\n]+;?\s*$/gm, '');

	// PascalCase JSX components (self-closing and paired), which appear
	// in Docusaurus READMEs as `<CalloutCard ... />`. Regular HTML tags
	// (lowercase or standard uppercase like `<DIV>`) are left alone;
	// only PascalCase names — the MDX convention for React components —
	// are stripped. Multi-line matches use [\s\S] to cross newlines.
	out = out.replace(/<([A-Z][A-Za-z0-9]*)[\s\S]*?\/>/g, '');
	out = out.replace(/<([A-Z][A-Za-z0-9]*)[\s\S]*?<\/\1>/g, '');

	// Collapse the extra blank lines the strips leave behind.
	out = out.replace(/\n{3,}/g, '\n\n');

	return out;
}

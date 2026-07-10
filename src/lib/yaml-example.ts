import type { ConfigField } from './types';

interface Options {
	name: string;
	spec: ConfigField[];
	pipelineName?: string;
	mode?: 'minimal' | 'complete';
}

export function generateYamlExample({
	name,
	spec,
	pipelineName,
	mode = 'minimal'
}: Options): string {
	const visible = spec.filter((f) => !f.hidden);
	const lines: string[] = [];

	if (mode === 'complete') {
		lines.push(`# Full configuration template. Uncomment and edit as needed.`);
	}
	lines.push(`name: ${pipelineName ?? `my-${name}-pipeline`}`);
	lines.push('runs:');
	lines.push(`  - ${name}:`);

	if (visible.length === 0) {
		lines.push(`      # This plugin takes no configuration.`);
		return lines.join('\n');
	}

	if (mode === 'complete') {
		for (const field of visible) {
			emitField(lines, field, '      ', !field.required);
		}
	} else {
		// Bare minimum: only required fields. Configuration tab has the rest.
		const required = visible.filter((f) => f.required);
		if (required.length === 0) {
			lines.push(`      # No required fields — see the Configuration tab.`);
		}
		for (const field of required) {
			emitField(lines, field, '      ', false);
		}
	}

	return lines.join('\n');
}

function emitField(lines: string[], field: ConfigField, indent: string, commented: boolean) {
	const prefix = commented ? `${indent}# ` : indent;

	if (field.type === 'object' && field.fields && field.fields.length > 0) {
		const suffix = field.is_array ? ' []  # list of objects — see structure below' : '';
		lines.push(`${prefix}${field.name}:${suffix}`);
		const subIndent = commented ? `${indent}#   ` : `${indent}  `;
		for (const sub of field.fields) {
			lines.push(`${subIndent}${sub.name}: ${sampleValue(sub)}`);
		}
		return;
	}

	if (field.type === 'multiselect' && !field.default) {
		lines.push(`${prefix}${field.name}: []`);
		return;
	}

	lines.push(`${prefix}${field.name}: ${sampleValue(field)}`);
}

function sampleValue(field: ConfigField): string {
	if (field.sensitive || field.type === 'password') return '"***"';

	if (field.default !== undefined && field.default !== null && field.default !== '') {
		return formatScalar(field.default);
	}
	if (field.placeholder) return `"${field.placeholder}"`;

	switch (field.type) {
		case 'bool':
			return 'false';
		case 'int':
			return '0';
		case 'select':
			if (field.options && field.options.length > 0) {
				return `"${field.options[0].value}"`;
			}
			return `"<${field.name}>"`;
		case 'multiselect':
			return '[]';
		case 'string':
		default:
			return `"<${field.name}>"`;
	}
}

function formatScalar(v: unknown): string {
	if (typeof v === 'string') return `"${v}"`;
	if (typeof v === 'boolean' || typeof v === 'number') return String(v);
	return JSON.stringify(v);
}

// A small semver constraint evaluator for plugins.yaml advisories, covering the forms the
// Go side (Masterminds/semver) accepts that we use: comparators (<, <=, >, >=, =, !=) joined by
// spaces or commas (all must hold) and alternatives joined by ||. Anything else is rejected,
// so a constraint the registry cannot evaluate fails the build rather than showing wrongly.

const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;
const COMPARATOR_RE = /^(<=|>=|!=|<|>|=)?\s*(v?\d+\.\d+\.\d+)$/;

export function parseVersion(v) {
	const m = String(v).match(VERSION_RE);
	if (!m) throw new Error(`${v} is not a semver version`);
	return m.slice(1).map(Number);
}

export function compare(a, b) {
	const pa = parseVersion(a);
	const pb = parseVersion(b);
	return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
}

/** Compiles a constraint into a predicate over versions, throwing on anything unsupported. */
export function constraint(text) {
	const alternatives = String(text)
		.split('||')
		.map((alt) =>
			alt
				.trim()
				.split(/[\s,]+/)
				.filter(Boolean)
				.reduce((parts, token) => {
					// Join an operator written apart from its version: ">= 0.3.1".
					if (/^(<=|>=|!=|<|>|=)$/.test(token)) parts.push(token);
					else if (parts.length && /^(<=|>=|!=|<|>|=)$/.test(parts.at(-1)))
						parts.push(parts.pop() + token);
					else parts.push(token);
					return parts;
				}, [])
				.map((part) => {
					const m = part.match(COMPARATOR_RE);
					if (!m) throw new Error(`unsupported constraint "${text}"`);
					const [, op = '=', version] = m;
					return (v) => {
						const c = compare(v, version);
						return {
							'<': c < 0,
							'<=': c <= 0,
							'>': c > 0,
							'>=': c >= 0,
							'=': c === 0,
							'!=': c !== 0
						}[op];
					};
				})
		);
	if (alternatives.some((alt) => alt.length === 0)) throw new Error(`empty constraint "${text}"`);
	return (v) => alternatives.some((alt) => alt.every((check) => check(v)));
}

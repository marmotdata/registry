// Sets object and array values on custom elements as properties, in the browser only. Passed as
// attributes, Svelte's server render would write them as strings ("" for an empty list), which the
// elements then fail to parse as JSON.
export function setProps<T extends HTMLElement>(node: T, values: Partial<Record<keyof T, unknown>>) {
	const apply = (v: Partial<Record<keyof T, unknown>>) => Object.assign(node, v);
	apply(values);
	return { update: apply };
}

export interface PluginVersion {
	version: string;
	digest: string;
	oci_ref: string;
}

export interface Plugin {
	namespace: string;
	name: string;
	display_name: string;
	description: string;
	icon: string;
	category: string | null;
	status: string | null;
	features: string[];
	official: boolean;
	source: string | null;
	latest_version: string | null;
	versions: PluginVersion[];
}

export interface PluginIndex {
	schema_version: number;
	plugin_count: number;
	plugins: Plugin[];
}

// Mirrors plugin-sdk types.
export type ConfigFieldType =
	| 'string'
	| 'int'
	| 'bool'
	| 'select'
	| 'multiselect'
	| 'password'
	| 'object';

export interface FieldOption {
	label: string;
	value: string;
}

export interface Validation {
	pattern?: string;
	min?: number;
	max?: number;
	min_len?: number;
	max_len?: number;
}

export interface ShowWhen {
	field: string;
	value: string;
}

export interface ConfigField {
	name: string;
	type: ConfigFieldType;
	label: string;
	description: string;
	required: boolean;
	default?: unknown;
	options?: FieldOption[];
	validation?: Validation;
	sensitive: boolean;
	placeholder?: string;
	fields?: ConfigField[];
	is_array?: boolean;
	show_when?: ShowWhen;
	hidden?: boolean;
}

export interface AssetSchemaField {
	name: string;
	type: string;
	description: string;
}

export interface AssetSchema {
	struct_name: string;
	display_name: string;
	description: string;
	fields: AssetSchemaField[];
}

export interface PluginMeta {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: string;
	status: string;
	features?: string[];
	config_spec: ConfigField[];
	asset_schemas?: AssetSchema[];
}

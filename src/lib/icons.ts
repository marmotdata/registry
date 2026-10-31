// The mark for every plugin and secret store. Keys are the `icon:` field in plugins.yaml and
// secret-stores.yaml, not the plugin name, so plugins can deliberately share a mark
// (glue/gluepipeline, kafka/kafkaconnect).
//
// Most marks come from @marmotdata/icons through <mm-provider-logo>, which bundles them offline and
// handles Light and Peat. A few are drawn here instead:
//   - local: the design system has no mark for the product, or only a generic glyph, and the
//     registry has the real artwork in static/img. Never borrow a neighbouring product's logo.
//   - provider: the plugin's icon key differs from the design system's provider key.
//
// hasDark swaps in static/img/dark-<name>.<ext> on Peat, for marks near-invisible on one ground.

export type IconSpec =
	| { provider: string }
	| { local: string; ext: 'svg' | 'png'; hasDark?: boolean };

const LOCAL: Record<string, IconSpec> = {
	amundsen: { local: 'amundsen', ext: 'svg', hasDark: true },
	confluent: { local: 'confluent', ext: 'png' },
	dagster: { local: 'dagster', ext: 'png' },
	deltalake: { local: 'deltalake', ext: 'svg' },
	iceberg: { local: 'iceberg', ext: 'svg' },
	openmetadata: { local: 'openmetadata', ext: 'png' },
	pinot: { local: 'pinot', ext: 'svg' },
	questdb: { local: 'questdb', ext: 'svg' },
	redpanda: { local: 'redpanda', ext: 'svg' },
	spline: { local: 'spline', ext: 'png' },
	starrocks: { local: 'starrocks', ext: 'svg' },
	// Timescale rebranded to TigerData; the design system still carries the old clock mark.
	timescale: { local: 'timescale', ext: 'svg', hasDark: true },

	// Amazon Data Firehose has no mark; it shipped as Kinesis Data Firehose and sits in that family.
	firehose: { provider: 'kinesis' },

	// Secret stores. Vendor marks where the product has none of its own.
	'aws-secrets-manager': { local: 'aws-secrets-manager', ext: 'svg' },
	'azure-key-vault': { provider: 'azureblob' },
	'google-secret-manager': { provider: 'gcs' },
	vault: { local: 'vault', ext: 'svg' },

	// Other ways to populate Marmot, on the Usage tab.
	terraform: { local: 'terraform', ext: 'svg' },
	pulumi: { local: 'pulumi', ext: 'svg' }
};

export function iconSpec(name: string): IconSpec {
	return LOCAL[name] ?? { provider: name };
}

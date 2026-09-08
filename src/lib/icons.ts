// Icon for every plugin in plugins.yaml. Keys are the `icon:` field, not the
// plugin name, so plugins can deliberately share a mark (glue/gluepipeline,
// kafka/kafkaconnect).
//
// Preference order when picking a mark:
//   1. the product's own logo, in colour        (logos:*, devicon:*)
//   2. the product's own logo, monochrome       (simple-icons:*)
//   3. a local SVG/PNG in static/img            when Iconify has no mark
//   4. the vendor's logo                        for services with no mark of their own
//   5. a generic glyph                          only for protocols, never products
//
// Rule of thumb: never borrow a neighbouring product's logo. Showing Postgres
// for TimescaleDB or Spark for Spline is worse than showing something generic.
//
// hasDark swaps in static/img/dark-<name>.<ext> under the dark theme, for marks
// that are near-invisible on one background.

export interface IconSpec {
	iconify?: string;
	local?: string;
	ext?: 'svg' | 'png';
	hasDark?: boolean;
}

const PLUGIN_ICONS: Record<string, IconSpec> = {
	airflow: { iconify: 'logos:airflow-icon' },
	amundsen: { local: 'amundsen', ext: 'svg', hasDark: true },
	asyncapi: { local: 'asyncapi', ext: 'svg', hasDark: true },
	athena: { iconify: 'logos:aws-athena' },
	// Azure Blob has no mark of its own; the Azure logo is the honest stand-in.
	azureblob: { iconify: 'logos:azure-icon' },
	bigquery: { iconify: 'devicon:googlecloud' },
	bigtable: { iconify: 'devicon:googlecloud' },
	cassandra: { iconify: 'devicon:cassandra' },
	clickhouse: { iconify: 'devicon:clickhouse' },
	'cloud-run': { iconify: 'logos:google-cloud-run' },
	cockroachdb: { iconify: 'simple-icons:cockroachlabs' },
	confluent: { local: 'confluent', ext: 'png' },
	couchbase: { iconify: 'logos:couchbase' },
	dagster: { local: 'dagster', ext: 'png' },
	databricks: { iconify: 'logos:databricks-icon' },
	dbt: { iconify: 'logos:dbt-icon' },
	deltalake: { local: 'deltalake', ext: 'svg' },
	doris: { iconify: 'simple-icons:apachedoris' },
	duckdb: { iconify: 'devicon:duckdb' },
	dynamodb: { iconify: 'logos:aws-dynamodb' },
	eks: { iconify: 'logos:aws-eks' },
	elasticsearch: { iconify: 'logos:elasticsearch' },
	firebase: { iconify: 'logos:firebase-icon' },
	// Amazon Data Firehose has no mark; it shipped as Kinesis Data Firehose and
	// still sits in that family.
	firehose: { iconify: 'logos:aws-kinesis' },
	flink: { iconify: 'logos:apache-flink-icon' },
	gcs: { iconify: 'devicon:googlecloud' },
	gke: { iconify: 'devicon:googlecloud' },
	glue: { iconify: 'logos:aws-glue' },
	googledrive: { iconify: 'logos:google-drive' },
	googlepubsub: { iconify: 'devicon:googlecloud' },
	grafana: { iconify: 'logos:grafana' },
	hive: { iconify: 'simple-icons:apachehive' },
	iceberg: { local: 'iceberg', ext: 'svg' },
	// devicon's Kafka mark is fixed black and disappears on the dark theme.
	kafka: { local: 'kafka', ext: 'svg', hasDark: true },
	kinesis: { iconify: 'logos:aws-kinesis' },
	kubernetes: { iconify: 'devicon:kubernetes' },
	lambda: { iconify: 'logos:aws-lambda' },
	mariadb: { iconify: 'logos:mariadb-icon' },
	metabase: { iconify: 'logos:metabase' },
	mlflow: { local: 'mlflow', ext: 'svg' },
	mongodb: { iconify: 'devicon:mongodb' },
	mysql: { iconify: 'devicon:mysql' },
	nats: { iconify: 'devicon:nats' },
	nifi: { iconify: 'simple-icons:apachenifi' },
	openapi: { iconify: 'devicon:openapi' },
	openmetadata: { local: 'openmetadata', ext: 'png' },
	opensearch: { iconify: 'logos:opensearch-icon' },
	oracle: { iconify: 'logos:oracle' },
	pinot: { local: 'pinot', ext: 'svg' },
	postgresql: { iconify: 'devicon:postgresql' },
	prefect: { iconify: 'simple-icons:prefect' },
	presto: { iconify: 'logos:presto-icon' },
	questdb: { local: 'questdb', ext: 'svg' },
	redash: { iconify: 'simple-icons:redash' },
	redis: { iconify: 'devicon:redis' },
	redpanda: { local: 'redpanda', ext: 'svg' },
	s3: { iconify: 'logos:aws-s3' },
	// SageMaker has no mark in any Iconify collection, so it falls back to AWS
	// rather than to a stock robot glyph.
	sagemaker: { iconify: 'simple-icons:amazonwebservices' },
	// SFTP is a protocol, not a product. A glyph is the right answer here.
	sftp: { iconify: 'mdi:folder-network-outline' },
	sns: { iconify: 'logos:aws-sns' },
	spline: { local: 'spline', ext: 'png' },
	'sql-server': { iconify: 'devicon:microsoftsqlserver' },
	sqlite: { local: 'sqlite', ext: 'png' },
	sqs: { iconify: 'logos:aws-sqs' },
	starrocks: { local: 'starrocks', ext: 'svg' },
	superset: { iconify: 'logos:apache-superset-icon' },
	// Timescale rebranded to TigerData; simple-icons:timescale is still the old
	// clock mark, so the current badge lives locally.
	timescale: { local: 'timescale', ext: 'svg', hasDark: true },
	trino: { iconify: 'simple-icons:trino' },
	'vertex-ai': { iconify: 'devicon:googlecloud' }
};

export function iconSpec(name: string): IconSpec {
	return PLUGIN_ICONS[name] ?? { iconify: 'lucide:box' };
}

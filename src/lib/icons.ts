// Icon mapping mirrors marmot's docs plugin cards (web/docs/src/components/PluginCards.tsx)
// so the registry and docs feel like the same product.
//
// Keys are the `icon:` field from plugins.yaml, not the plugin name. Several
// plugins deliberately share an icon (glue/gluepipeline, kafka/kafkaconnect).
//
// Iconify collections used:
//   logos:*           — full-colour brand logos (AWS, Azure, GCP, Airflow, dbt, …)
//   devicon:*         — developer tool logos (PostgreSQL, MySQL, MongoDB, Kafka, …)
//   simple-icons:*    — monochrome brand marks for the stragglers (Trino, Hive, …)
//   mdi:*, carbon:*, material-symbols:* — generic glyphs where no brand mark exists
//
// A handful of icons don't have a good hosted match and live as SVG/PNG in
// static/img (copied from marmot's docs).

export interface IconSpec {
	iconify?: string;
	local?: string;
	ext?: 'svg' | 'png';
	hasDark?: boolean;
}

const PLUGIN_ICONS: Record<string, IconSpec> = {
	airflow: { iconify: 'logos:airflow-icon' },
	asyncapi: { local: 'asyncapi', ext: 'svg', hasDark: true },
	athena: { iconify: 'logos:aws-athena' },
	azureblob: { iconify: 'logos:azure-icon' },
	bigquery: { iconify: 'devicon:googlecloud' },
	bigtable: { iconify: 'devicon:googlecloud' },
	cassandra: { iconify: 'logos:cassandra' },
	clickhouse: { iconify: 'devicon:clickhouse' },
	'cloud-run': { iconify: 'logos:google-cloud-run' },
	cockroachdb: { iconify: 'simple-icons:cockroachlabs' },
	confluent: { local: 'confluent', ext: 'png' },
	couchbase: { iconify: 'logos:couchbase' },
	dagster: { local: 'dagster', ext: 'png' },
	databricks: { iconify: 'simple-icons:databricks' },
	dbt: { iconify: 'logos:dbt-icon' },
	deltalake: { local: 'deltalake', ext: 'svg' },
	doris: { iconify: 'simple-icons:apachedoris' },
	duckdb: { iconify: 'devicon:duckdb' },
	dynamodb: { iconify: 'logos:aws-dynamodb' },
	eks: { iconify: 'logos:aws-eks' },
	elasticsearch: { iconify: 'logos:elasticsearch' },
	firebase: { iconify: 'logos:firebase' },
	firehose: { iconify: 'logos:aws-kinesis' },
	flink: { iconify: 'logos:apache-flink-icon' },
	gcs: { iconify: 'logos:google-cloud' },
	gke: { iconify: 'logos:google-icon' },
	glue: { iconify: 'logos:aws-glue' },
	googledrive: { iconify: 'logos:google-drive' },
	googlepubsub: { iconify: 'logos:google-cloud' },
	grafana: { iconify: 'logos:grafana' },
	hive: { iconify: 'simple-icons:apachehive' },
	iceberg: { local: 'iceberg', ext: 'svg' },
	kafka: { iconify: 'devicon:apachekafka' },
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
	presto: { iconify: 'logos:presto' },
	questdb: { local: 'questdb', ext: 'svg' },
	redash: { iconify: 'simple-icons:redash' },
	redis: { iconify: 'devicon:redis' },
	redpanda: { local: 'redpanda', ext: 'svg' },
	s3: { iconify: 'logos:aws-s3' },
	sagemaker: { iconify: 'material-symbols:robot-2-outline' },
	sftp: { iconify: 'mdi:folder-network-outline' },
	sns: { iconify: 'logos:aws-sns' },
	spark: { iconify: 'logos:apache-spark' },
	'sql-server': { iconify: 'simple-icons:microsoftsqlserver' },
	sqlite: { local: 'sqlite', ext: 'png' },
	sqs: { iconify: 'logos:aws-sqs' },
	starrocks: { iconify: 'carbon:datastore' },
	superset: { iconify: 'simple-icons:apachesuperset' },
	trino: { iconify: 'simple-icons:trino' },
	'vertex-ai': { iconify: 'material-symbols:robot-2-outline' }
};

export function iconSpec(name: string): IconSpec {
	return PLUGIN_ICONS[name] ?? { iconify: 'lucide:box' };
}

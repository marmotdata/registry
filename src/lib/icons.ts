// Icon mapping mirrors marmot's docs plugin cards (web/docs/src/components/PluginCards.tsx)
// so the registry and docs feel like the same product.
//
// Iconify collections used:
//   logos:*        — full-colour brand logos (AWS, Azure, GCP, Airflow, dbt, …)
//   devicon:*      — developer tool logos (PostgreSQL, MySQL, MongoDB, Kafka, …)
//   simple-icons:* — the odd stragglers (Trino)
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
	azureblob: { iconify: 'logos:azure-icon' },
	bigquery: { iconify: 'devicon:googlecloud' },
	clickhouse: { iconify: 'devicon:clickhouse' },
	confluent: { local: 'confluent', ext: 'png' },
	dbt: { iconify: 'logos:dbt-icon' },
	deltalake: { local: 'deltalake', ext: 'svg' },
	duckdb: { iconify: 'devicon:duckdb' },
	dynamodb: { iconify: 'logos:aws-dynamodb' },
	eks: { iconify: 'logos:aws-eks' },
	elasticsearch: { iconify: 'logos:elasticsearch' },
	gcs: { iconify: 'logos:google-cloud' },
	gke: { iconify: 'logos:google-icon' },
	glue: { iconify: 'logos:aws-glue' },
	iceberg: { local: 'iceberg', ext: 'svg' },
	kafka: { iconify: 'devicon:apachekafka' },
	kubernetes: { iconify: 'devicon:kubernetes' },
	lambda: { iconify: 'logos:aws-lambda' },
	mongodb: { iconify: 'devicon:mongodb' },
	mysql: { iconify: 'devicon:mysql' },
	nats: { iconify: 'devicon:nats' },
	openapi: { iconify: 'devicon:openapi' },
	opensearch: { iconify: 'logos:opensearch-icon' },
	postgresql: { iconify: 'devicon:postgresql' },
	redis: { iconify: 'devicon:redis' },
	redpanda: { local: 'redpanda', ext: 'svg' },
	s3: { iconify: 'logos:aws-s3' },
	sns: { iconify: 'logos:aws-sns' },
	sqs: { iconify: 'logos:aws-sqs' },
	trino: { iconify: 'simple-icons:trino' }
};

export function iconSpec(name: string): IconSpec {
	return PLUGIN_ICONS[name] ?? { iconify: 'lucide:box' };
}

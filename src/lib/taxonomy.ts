// Presentation metadata for the registry's tag vocabulary: categories,
// features and statuses. plugins.yaml stores machine slugs; this module maps
// them to labels, icons and tones so tags read consistently everywhere.

import {
	Database,
	Warehouse,
	HardDrive,
	Workflow,
	Container,
	LayoutDashboard,
	BookOpen,
	Brain,
	Radio,
	Search as SearchIcon,
	Boxes,
	GitBranch,
	History,
	BookA,
	FlaskConical,
	CircleCheck,
	CircleAlert,
	Sparkles,
	Tag
} from 'lucide-svelte';

/** lucide-svelte ships class components; derive the type from one of them. */
export type IconComponent = typeof Database;

/** Colour family for a tag. Neutral is the default; tints are used sparingly. */
export type Tone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'accent';

/**
 * Browse categories.
 *
 * plugins.yaml carries fifteen fine-grained `category` slugs that overlap
 * (compute vs container, messaging vs streaming, database vs data-warehouse)
 * and several hold a single plugin. The registry browses by these ten groups
 * instead. Each group lists the raw slugs it absorbs; PLUGIN_OVERRIDES moves
 * individual plugins whose raw slug lands them in the wrong group. This is
 * presentation only: plugins.json is unchanged for downstream consumers.
 */
export interface CategoryInfo {
	/** Stable id used in URLs (?category=...). */
	id: string;
	label: string;
	description: string;
	icon: IconComponent;
	/** Raw plugins.yaml slugs that map here. */
	slugs: string[];
}

export const CATEGORIES: CategoryInfo[] = [
	{
		id: 'databases',
		label: 'Databases',
		description: 'Operational relational, document, key-value and time-series stores',
		icon: Database,
		slugs: ['database']
	},
	{
		id: 'warehouses',
		label: 'Warehouses',
		description: 'Analytical warehouses and distributed query engines',
		icon: Warehouse,
		slugs: ['data-warehouse']
	},
	{
		id: 'storage',
		label: 'Storage',
		description: 'Object storage, file shares and lakehouse table formats',
		icon: HardDrive,
		slugs: ['storage', 'data-lake']
	},
	{
		id: 'streaming',
		label: 'Streaming',
		description: 'Event streams, message queues and pub/sub',
		icon: Radio,
		slugs: ['streaming', 'messaging']
	},
	{
		id: 'pipelines',
		label: 'Pipelines',
		description: 'Schedulers, ETL, stream processors and transformation tools',
		icon: Workflow,
		slugs: ['orchestration', 'etl', 'transformation']
	},
	{
		id: 'dashboards',
		label: 'Dashboards',
		description: 'Business intelligence and visualisation tools',
		icon: LayoutDashboard,
		slugs: ['dashboard']
	},
	{
		id: 'catalogs',
		label: 'Catalogs',
		description: 'Other metadata catalogs and API specifications',
		icon: BookOpen,
		slugs: ['catalog', 'api']
	},
	{
		id: 'ml',
		label: 'Machine learning',
		description: 'ML platforms and experiment tracking',
		icon: Brain,
		slugs: ['ml']
	},
	{
		id: 'compute',
		label: 'Compute',
		description: 'Kubernetes, serverless and container platforms',
		icon: Container,
		slugs: ['compute', 'container']
	},
	{
		id: 'search',
		label: 'Search',
		description: 'Search and analytics indexes',
		icon: SearchIcon,
		slugs: []
	}
];

/** Plugins whose raw slug files them in the wrong group, keyed by plugin name. */
const PLUGIN_OVERRIDES: Record<string, string> = {
	elasticsearch: 'search',
	opensearch: 'search',
	clickhouse: 'warehouses',
	pinot: 'warehouses',
	duckdb: 'warehouses',
	trino: 'warehouses'
};

function titleCase(slug: string): string {
	return slug
		.split(/[-_]/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
const BY_SLUG = new Map(CATEGORIES.flatMap((c) => c.slugs.map((s) => [s, c] as const)));

const OTHER: CategoryInfo = {
	id: 'other',
	label: 'Other',
	description: '',
	icon: Tag,
	slugs: []
};

/** Look a group up by its id (as used in URLs). */
export function categoryInfo(id: string): CategoryInfo {
	return BY_ID.get(id) ?? OTHER;
}

/** The group a plugin browses under. */
export function categoryOf(plugin: { name: string; category: string | null }): CategoryInfo | null {
	const override = PLUGIN_OVERRIDES[plugin.name];
	if (override) return categoryInfo(override);
	if (!plugin.category) return null;
	return BY_SLUG.get(plugin.category) ?? OTHER;
}

export interface FeatureInfo {
	name: string;
	description: string;
	icon: IconComponent;
}

const FEATURES: Record<string, Omit<FeatureInfo, 'name'>> = {
	Assets: { description: 'Discovers assets and their schemas', icon: Boxes },
	Lineage: { description: 'Captures upstream and downstream lineage', icon: GitBranch },
	'Run History': { description: 'Records pipeline and job runs', icon: History },
	Glossary: { description: 'Imports business glossary terms', icon: BookA }
};

/** Canonical display order so feature tags line up across cards. */
const FEATURE_ORDER = Object.keys(FEATURES);

export function featureInfo(name: string): FeatureInfo {
	const known = FEATURES[name];
	return known ? { name, ...known } : { name, description: '', icon: Sparkles };
}

export function sortFeatures(names: string[]): FeatureInfo[] {
	return [...names]
		.sort((a, b) => {
			const ia = FEATURE_ORDER.indexOf(a);
			const ib = FEATURE_ORDER.indexOf(b);
			return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
		})
		.map(featureInfo);
}

export interface StatusInfo {
	slug: string;
	label: string;
	description: string;
	icon: IconComponent;
	tone: Tone;
}

const STATUSES: Record<string, Omit<StatusInfo, 'slug'>> = {
	experimental: {
		label: 'Experimental',
		description: 'Early release. Interfaces and output may change between versions.',
		icon: FlaskConical,
		tone: 'amber'
	},
	beta: {
		label: 'Beta',
		description: 'Feature complete. Gathering feedback before a stable release.',
		icon: FlaskConical,
		tone: 'blue'
	},
	stable: {
		label: 'Stable',
		description: 'Production ready. Follows semantic versioning.',
		icon: CircleCheck,
		tone: 'green'
	},
	deprecated: {
		label: 'Deprecated',
		description: 'No longer maintained. Migrate to an alternative.',
		icon: CircleAlert,
		tone: 'red'
	}
};

export function statusInfo(slug: string): StatusInfo {
	const known = STATUSES[slug];
	return known
		? { slug, ...known }
		: { slug, label: titleCase(slug), description: '', icon: Tag, tone: 'neutral' };
}

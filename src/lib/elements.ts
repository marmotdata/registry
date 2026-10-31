// Registers the Marmot elements the registry uses. Imported once from the root layout, so they are
// defined before hydration and Svelte can set object properties (facet options, schema columns)
// directly. Lit's DOM shim makes these imports safe during prerender too.
import '@marmotdata/icons/define.js';
import '@marmotdata/elements/button.js';
import '@marmotdata/elements/callout.js';
import '@marmotdata/elements/code-sample.js';
import '@marmotdata/elements/copy-button.js';
import '@marmotdata/elements/description-list.js';
import '@marmotdata/elements/empty-state.js';
import '@marmotdata/elements/facet-sidebar.js';
import '@marmotdata/elements/list.js';
import '@marmotdata/elements/link.js';
import '@marmotdata/elements/logo.js';
import '@marmotdata/elements/filter-pill.js';
import '@marmotdata/elements/breadcrumbs.js';
import '@marmotdata/elements/page-header.js';
import '@marmotdata/elements/schema-table.js';
import '@marmotdata/elements/search-field.js';
import '@marmotdata/elements/segmented-control.js';
import '@marmotdata/elements/select.js';
import '@marmotdata/elements/status-pill.js';
import '@marmotdata/elements/count.js';

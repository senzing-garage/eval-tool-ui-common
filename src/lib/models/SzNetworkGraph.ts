import { SzSdkEntityResponse, SzSdkFindNetworkResponse } from "../models/grpc/engine"
import { SzDataSourceComposite } from "./data-sources";
import { SzMatchKeyTokenFilterScope } from "./graph";

export interface SzNetorkGraphCompositeResponse {
    ENTITY_RESPONSES: SzSdkEntityResponse[],
    NETWORK_RESPONSES: SzSdkFindNetworkResponse[]
}

export interface SzNetworkGraphInputs {
    data: SzNetorkGraphCompositeResponse
    showLinkLabels: boolean;
}

// ---------------------------------------------------------------------------
//  Graph Import/Export types
// ---------------------------------------------------------------------------

/** Zoom / pan transform state of the graph viewport. */
export interface SzGraphExportViewport {
    zoom: number;
    panX: number;
    panY: number;
}

/** Top-level envelope for a serialised graph snapshot. */
export interface SzGraphExport {
    version: string;
    exportedAt: string;
    query: SzGraphExportQuery;
    viewport: SzGraphExportViewport;
    nodes: SzGraphExportNode[];
    links: SzGraphExportLink[];
    graphPrefs: SzGraphExportPrefs;
}

/** The original query parameters used to build the graph. */
export interface SzGraphExportQuery {
    graphIds: number[];
    maxDegreesOfSeparation: number;
    maxEntities: number;
    buildOut: number;
}

/** Per-node position stored in the export. */
export interface SzGraphExportNodePosition {
    x: number;
    y: number;
}

/** Expand/collapse and visibility state of a single node. */
export interface SzGraphExportNodeState {
    isHidden: boolean;
    hasCollapsedRelationships: boolean;
    areAllRelatedEntitiesOnDeck: boolean;
    numberRelated: number;
    numberRelatedOnDeck: number;
    numberRelatedHidden: number;
}

/** Match-key token breakdown attached to a node. */
export interface SzGraphExportNodeMatchKeyTokens {
    coreRelationshipMatchKeyTokens: string[];
    relationshipMatchKeyTokens: string[];
}

/** A single node in the export – UI metadata + entity data. */
export interface SzGraphExportNode {
    entityId: number | string;
    isPrimaryEntity: boolean;
    isCoreNode: boolean;
    isQueriedNode: boolean;

    position: SzGraphExportNodePosition;
    state: SzGraphExportNodeState;
    relatedEntities: Array<number | string>;

    iconType: string;
    name: string;
    orgName: string;
    address: string;
    phone: string;
    dataSources: string[];
    recordSummaries: Record<string, unknown>;

    matchKeyTokens: SzGraphExportNodeMatchKeyTokens;

    resolvedEntityData: SzSdkEntityResponse | null;
    relatedEntitiesData: Record<string, unknown> | null;
}

/** A single link (edge) in the export. */
export interface SzGraphExportLink {
    id: number;
    sourceEntityId: number | string;
    targetEntityId: number | string;
    matchLevel: string;
    matchKey: string;
    isCoreLink: boolean;
    isHidden: boolean;
}

/** Metadata returned when listing saved graph snapshots (no graph_data). */
export interface SzSavedGraphExportMeta {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    entity_ids: string;
    node_count: number;
    link_count: number;
    version: string;
}

/** Serialised graph preferences – mirrors SzGraphPrefs.toJSONObject(). */
export interface SzGraphExportPrefs {
    openInNewTab: boolean;
    openInSidePanel: boolean;
    dataSourceColors: SzDataSourceComposite[];
    showLinkLabels: boolean;
    rememberStateOptions: boolean;
    maxDegreesOfSeparation: number;
    maxEntities: number;
    buildOut: number;
    dataSourcesFiltered: string[];
    matchKeysIncluded: string[];
    matchKeyTokensIncluded: string[];
    matchKeyCoreTokensIncluded: string[];
    neverFilterQueriedEntityIds: boolean;
    queriedEntitiesColor: string | undefined;
    focusedEntitiesColor: string | undefined;
    linkColor: string | undefined;
    indirectLinkColor: string | undefined;
    unlimitedMaxEntities: boolean;
    unlimitedMaxScope: boolean;
    suppressL1InterLinks: boolean;
    matchKeyTokenSelectionScope: SzMatchKeyTokenFilterScope;
}
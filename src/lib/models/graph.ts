import { SzEntityIdentifier, SzSdkRelatedEntity, SzSdkResolvedEntity } from "./grpc/engine"

export enum SzMatchKeyTokenFilterScope {
  CORE,
  EXTRANEOUS
}

export interface SzMatchKeyComposite {
  name: string,
  index?: number,
  hidden?: boolean
}

export interface SzMatchKeyTokenComposite {
  derived: boolean,
  disclosed: boolean,
  name: string
  count: number,
  coreCount?: number,
  visible?: number,
  entitiesOnCanvas?: Array<string|number>,
  entityIds: Array<string|number>,
  coreEntityIds?: Array<SzEntityIdentifier>,
  index?: number,
  hidden?: boolean
}

export interface SzGraphTooltipEntityModel {
  label: string;
  id: number;
  orgName?: string;
  name?: string;
  gender?: string;
  address: string;
  phone: string;
  sources: string[];
}

export interface SzGraphTooltipLinkModel {
  label: string;
  matchKey: string;
}

export interface SzGraphNodeFilterPair {
  selectorFn: any;
  modifierFn?: any;
  selectorArgs?: any;
  modifierArgs?: any;
}

/** return object from a SzRelationshipNetworkComponent.getMatchKeyTokensFromEntityData(data) request */
export interface SzEntityNetworkMatchKeyTokens {
  DISCLOSED: {[key: string]: Array<string|number>},
  DERIVED: {[key: string]: Array<string|number>},
  CORE?: {
    DISCLOSED: {[key: string]: Array<string|number>},
    DERIVED: {[key: string]: Array<string|number>}
  }
}

/** Entity wrapper used by the graph's internal camelCase data model (e.g. asEntityNetworkData). */
export interface SzGraphEntityWrapper {
  resolvedEntity: SzSdkResolvedEntity;
  relatedEntities: SzSdkRelatedEntity[];
}

/** Path between two entities in the graph's internal data model. */
export interface SzGraphEntityPath {
  startEntityId: number;
  endEntityId: number;
}

/** Return type of SzRelationshipNetworkComponent.asEntityNetworkData(). */
export interface SzGraphEntityNetworkData {
  entities: SzGraphEntityWrapper[];
  entityPaths: SzGraphEntityPath[];
}

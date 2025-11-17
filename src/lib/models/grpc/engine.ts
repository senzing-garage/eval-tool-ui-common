export type SzSdkSearchMatchLevel = 'RESOLVED' | 'POSSIBLY_SAME' | 'NAME_ONLY'| 'POSSIBLY_RELATED' | 'DISCLOSED';
/** the possible values of a `SzResolutionStepListItemType` is */
export const SzSdkSearchMatchLevel = {
    MATCH: 'RESOLVED' as SzSdkSearchMatchLevel,
    NAME_ONLY_MATCH: 'NAME_ONLY' as SzSdkSearchMatchLevel,
    POSSIBLE_MATCH: 'POSSIBLY_SAME' as SzSdkSearchMatchLevel,
    POSSIBLY_RELATED: 'POSSIBLY_RELATED' as SzSdkSearchMatchLevel,
    DISCLOSED: 'DISCLOSED' as SzSdkSearchMatchLevel,
};
export interface SzSdkEntityFeature {
    FEAT_DESC: string
    FEAT_DESC_VALUES: {
        FEAT_DESC: string, LIB_FEAT_ID: number
    }[]
    LIB_FEAT_ID: number
    USAGE_TYPE?: string,
    LABEL?: string
}
export interface SzSdkEntityFeatures {[key: string]: SzSdkEntityFeature[]}
export interface SzSdkSearchRecordSummary {DATA_SOURCE: string, RECORD_COUNT: number}
export interface SzSdkSearchResolvedEntity{
    ENTITY_ID: number,
    ENTITY_NAME: string,
    FEATURES?: SzSdkEntityFeatures,
    RECORDS?: {DATA_SOURCE: string, RECORD_ID: string}[],
    RECORD_SUMMARY?: SzSdkSearchRecordSummary[]
}

export interface SzSdkSearchResult {
    ENTITY: {
        RESOLVED_ENTITY: SzSdkSearchResolvedEntity
    },
    MATCH_INFO: {
        ERRULE_CODE: string
        MATCH_KEY: string
        MATCH_LEVEL_CODE: SzSdkSearchMatchLevel
    }
}
export interface SzSdkSearchRelatedEntity {

}

export interface SzSdkSearchResponse {
    RESOLVED_ENTITIES: SzSdkSearchResult[],
    RELATED_ENTITIES: SzSdkSearchResult[]
}

export interface SzSdkEntityBaseRecord {
    RECORD_ID: string,
    DATA_SOURCE: string,
}
export interface SzSdkEntityRelatedRecord extends SzSdkEntityBaseRecord {}
export interface SzSdkEntityRecord extends SzSdkEntityBaseRecord {
    INTERNAL_ID?: number,
    MATCH_KEY?: string,
    MATCH_LEVEL_CODE?: SzSdkSearchMatchLevel,
    ERRULE_CODE?: string,
    FIRST_SEEN_DT?: string,
    LAST_SEEN_DT?: string,
    FEATURES?: SzSdkEntityFeatures,
    NAMEORG?: string
}

export interface SzSdkEntityRecordSummary {
    DATA_SOURCE: string,
    RECORD_COUNT: number,
    TOP_RECORD_IDS?: Array<string>;
}

export interface SzSdkBaseEntity {
    ENTITY_ID: number,
    ENTITY_NAME:string,
    RECORD_SUMMARY?: SzSdkEntityRecordSummary[]
}

export interface SzSdkRelatedEntity  extends SzSdkBaseEntity {
    ERRULE_CODE?: string,
    IS_AMBIGUOUS?: 0 | 1,
    IS_DISCLOSED?: 0 | 1,
    MATCH_KEY: string,
    MATCH_LEVEL_CODE: SzSdkSearchMatchLevel,
    RECORDS?: SzSdkEntityRelatedRecord[]
}

export interface SzSdkResolvedEntity extends SzSdkBaseEntity {
    IS_BUSINESS?: boolean,
    FEATURES?: SzSdkEntityFeatures,
    RECORDS?: SzSdkEntityRecord[],
}

export interface SzSdkEntityResponse {
    RELATED_ENTITIES: SzSdkRelatedEntity[],
    RESOLVED_ENTITY: SzSdkResolvedEntity
}

export interface SzSdkFindNetworkNetworkLink {
    MIN_ENTITY_ID: number,
    MAX_ENTITY_ID: number,
    MATCH_LEVEL_CODE: SzSdkSearchMatchLevel,
    MATCH_KEY: string,
    ERRULE_CODE?: string,
    IS_DISCLOSED?: 0 | 1,
    IS_AMBIGUOUS?: 0 | 1
}

export interface SzSdkFindNetworkNetworkPath {
    START_ENTITY_ID: number, 
    END_ENTITY_ID: number, 
    ENTITIES: number[]
}

export interface SzFindNetworkEntity {
    RELATED_ENTITIES: SzSdkRelatedEntity[],
    RESOLVED_ENTITY: SzSdkResolvedEntity
}

export interface SzSdkFindNetworkResponse {
    ENTITIES: SzFindNetworkEntity[],
    ENTITY_NETWORK_LINKS: SzSdkFindNetworkNetworkLink[],
    ENTITY_PATHS: SzSdkFindNetworkNetworkPath[]
}


export interface SzSdkVirtualEntityRecord extends SzSdkEntityBaseRecord {}
/**
 * Describes a record that belongs to a virtual entity.  This identifies the record(s) as well as its internal ID to understand which records in the virtual entity are considered to be duplicates of each other.
 */
export interface SzSdkVirtualEntityMemberRecord {
    "INTERNAL_ID": number,
    "RECORDS": SzSdkVirtualEntityRecord[]
}
/**
 * Describes a virtual entity that describes an interim resolution step for an actual entity.  Virtual entities that consist of a single record (or multiple \"identical\" records) are considered singletons and are the initial building blocks in how an entity is resolved.  Those with multiple distinct records are compound virtual entities formed from resolving two virtual entities.
 */
export interface SzSdkVirtualEntity {
    /**
     * The unique identifier that distinguishes this virtual entity from all other virtual entities among all steps in a \"how\" result.
     */
    VIRTUAL_ENTITY_ID?: string,
    /**
     * The array of `SzSdkVirtualEntityMemberRecord` identifying the constituent records of the virtual entity.  Those records in the array with the same `internalId` property are effectively identical for the purposes of entity resolution.
     */
    MEMBER_RECORDS?: SzSdkVirtualEntityMemberRecord[]
}

export interface SzSdkHowFeatureScore {
    "INBOUND_FEAT_ID": number,
    "INBOUND_FEAT_DESC": string,
    "INBOUND_FEAT_USAGE_TYPE": string,
    "CANDIDATE_FEAT_ID": number,
    "CANDIDATE_FEAT_DESC": string,
    "CANDIDATE_FEAT_USAGE_TYPE": string,
    "SCORE": number,
    "ADDITIONAL_SCORES"?: {
        "FULL_SCORE": number
    },
    "SCORE_BUCKET": string,
    "SCORE_BEHAVIOR": string
}

/**
 * Describes a single step in describing how an entity was created.  Each step consists of either the formation of a new \"virtual entity\" from two records, the adding of a record to an existing virtual entity to create a new virtual entity, or the resolving of two virtual entities into a new virtual entity consisting of all the records.
 */
export interface SzSdkHowResolutionStep {
    /**
     * The step number indicating the order of this step relative to other steps if the steps were flattened to be linear.  However, the non-linear nature of entity resolution means that the ordering of the steps is only relevant within a single branch of the resolution tree.
     */
    STEP?: number,
    VIRTUAL_ENTITY_1?: SzSdkVirtualEntity,
    VIRTUAL_ENTITY_2?: SzSdkVirtualEntity,
    INBOUND_VIRTUAL_ENTITY_ID?: string,
    /**
     * The virtual entity ID identifying the virtual entity that resulted from resolving the inbound and candidate virtual entities.
     */
    RESULT_VIRTUAL_ENTITY_ID?: string,
    MATCH_INFO?: {
        "MATCH_KEY": string,
        "ERRULE_CODE": string,
        "CANDIDATE_KEYS": {
            [key: string]: {"FEAT_ID": number,"FEAT_DESC": string}[],
        }
        /*"CANDIDATE_KEYS": {
            "ADDR_KEY": {"FEAT_ID": number,"FEAT_DESC": string}[],
        }*/
    },
    FEATURE_SCORES?: {
        [key: string] : SzSdkHowFeatureScore[]
    }
}
/**
 * Describes the result of the \"how entity\" operation as a mapping of non-singleton virtual entity ID's to their corresponding `SzResolutionStep` instances as well as an array of `SzVirtualEntity` instances describing the possible final states for the entity. **NOTE**: If there are more than one possible final states then the entity requires reevaluation, while a result with a single final state does not require reevaluation.
 */
export interface SzSdkHowEntityResults {
    /**
     * The array of `SzSdkHowResolutionStep` instances describing how the virtual entity was formed.  Since singleton virtual entities are base building blocks, they do not have an associated how step.  They are simply formed by the loading of a record to the repository.
     */
    RESOLUTION_STEPS: SzSdkHowResolutionStep[],
    FINAL_STATE: {
        NEED_REEVALUATION: boolean,
        VIRTUAL_ENTITIES: SzSdkVirtualEntity[]
    }
}

/**
 * Describes the result of the \"how entity\" operation as a mapping of non-singleton virtual entity ID's to their corresponding `SzResolutionStep` instances as well as an array of `SzVirtualEntity` instances describing the possible final states for the entity. **NOTE**: If there are more than one possible final states then the entity requires reevaluation, while a result with a single final state does not require reevaluation.
 */
export interface SzSdkHowEntityResponse {
    HOW_RESULTS: SzSdkHowEntityResults
}

/*
export interface SzGraphNetworkResponse extends SzSdkFindNetworkResponse {
    ENTITIES: {
        RELATED_ENTITIES: SzSdkRelatedEntity[],
        RESOLVED_ENTITY: SzSdkResolvedEntity
    }[],
    ENTITY_NETWORK_LINKS: SzSdkFindNetworkNetworkLink[],
    ENTITY_PATHS: SzSdkFindNetworkNetworkPath[]
}
*/
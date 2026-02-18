import { SzSdkEntityFeatures, SzSdkEntityRecord, SzSdkSearchResolvedEntity } from './engine';

/** Feature score returned in a why response MATCH_INFO.FEATURE_SCORES */
export interface SzSdkWhyFeatureScore {
    INBOUND_FEAT_ID: number;
    INBOUND_FEAT_DESC: string;
    INBOUND_FEAT_USAGE_TYPE?: string;
    CANDIDATE_FEAT_ID: number;
    CANDIDATE_FEAT_DESC: string;
    CANDIDATE_FEAT_USAGE_TYPE?: string;
    SCORE: number;
    SCORING_BUCKET: string;
    SCORING_BEHAVIOR: string;
    NAME_SCORING_DETAILS?: {
        FULL_SCORE?: number;
        ORG_NAME_SCORE?: number;
        GIVEN_NAME_SCORE?: number;
        SURNAME_SCORE?: number;
        GENERATION_MATCH_SCORE?: number;
    };
}

/** Candidate key entry in MATCH_INFO.CANDIDATE_KEYS */
export interface SzSdkWhyCandidateKey {
    FEAT_ID: number;
    FEAT_DESC: string;
}

/** Match info block shared by whyEntities and whyRecordInEntity responses */
export interface SzSdkWhyMatchInfo {
    WHY_KEY?: string;
    WHY_NOT_KEY?: string;
    MATCH_LEVEL_CODE: string;
    ERRULE_CODE?: string;
    FEATURE_SCORES?: {
        [featureType: string]: SzSdkWhyFeatureScore[];
    };
    CANDIDATE_KEYS?: {
        [featureType: string]: SzSdkWhyCandidateKey[];
    };
}

/** Focus record in a whyRecordInEntity result */
export interface SzSdkWhyFocusRecord {
    DATA_SOURCE: string;
    RECORD_ID: string;
}

/** Single result from whyRecordInEntity */
export interface SzSdkWhyRecordInEntityResult {
    INTERNAL_ID: number;
    ENTITY_ID: number;
    FOCUS_RECORDS: SzSdkWhyFocusRecord[];
    MATCH_INFO: SzSdkWhyMatchInfo;
}

/** Single result from whyEntities */
export interface SzSdkWhyEntitiesResult {
    ENTITY_ID_1: number;
    ENTITY_ID_2: number;
    MATCH_INFO: SzSdkWhyMatchInfo;
}

/** Entity data block returned in both why responses */
export interface SzSdkWhyEntityData {
    RESOLVED_ENTITY: SzSdkSearchResolvedEntity;
    RELATED_ENTITIES?: any[];
}

/** Top-level response from whyRecordInEntity */
export interface SzSdkWhyRecordInEntityResponse {
    WHY_RESULTS: SzSdkWhyRecordInEntityResult[];
    ENTITIES: SzSdkWhyEntityData[];
}

/** Top-level response from whyEntities */
export interface SzSdkWhyEntitiesResponse {
    WHY_RESULTS: SzSdkWhyEntitiesResult[];
    ENTITIES: SzSdkWhyEntityData[];
}

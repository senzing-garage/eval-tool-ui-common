import { SzSdkEntityRecord, SzSdkEntityResponse, SzSdkRelatedEntity, SzSdkResolvedEntity } from '../models/grpc/engine';
import { SzBoundType } from '../models/statistics/szBoundType';
import { SzRelationType } from '../models/statistics/szRelationType';

export interface SzSampleSetEntity {
    entity?: SzSdkResolvedEntity;
    /**
     * The array of RelatedEntity instances describing the possible matches, discovered relationships, and disclosed relationships.
     */
    relatedEntities?: Array<SzSdkRelatedEntity>;
}
export interface SzSampleSetRelation {
    entity?: SzSdkResolvedEntity;
    /**
     * The array of RelatedEntity instances describing the possible matches, discovered relationships, and disclosed relationships.
     */
    relatedEntity?: SzSdkRelatedEntity;
    matchType?: SzRelationType;
    /**
     * The match key describing what features matched between the first record in the resolved entity and this record.
     */
    matchKey?: string;
    /**
     * The code identifying the resolution rule that related the entities to one another.
     */
    principle?: string;
}
export interface SzSampleSetRelationsPage { 
    /**
     * The relationship bound value that contains two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the first entity in the relationship and the second entity  ID value identifies the related entity in the relationship.
     */
    bound: string;
    boundType: SzBoundType;
    /**
     * The requested page size representing the maximum number of  `SzRelation`'s' that were included in the page.
     */
    pageSize: number;
    /**
     * The requested sample size representing the number of `SzRelation`'s to be randomly selected from the page of results.
     */
    sampleSize?: number;
    /**
     * The minimum relation value of the returned results.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the least value of first entity in the relationship and the second entity ID value identifies the least value of those entity ID's related to the first entity. **NOTE:** This field is absent or `null` if there are no results.
     */
    minimumValue?: string;
    /**
     * The maximum relation value of the returned results.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the greatest value of first entity in the relationship and the second entity ID value identifies the greatest value of those entity ID's related to the first  entity.  **NOTE:** This field is absent or `null` if there are no results.
     */
    maximumValue?: string;
    /**
     * The minimum relation value of the entire relations page.  This will be the same as `minimumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the minimum relation value of all the candidate relations on the page that were used for random sample selection even if that relation was not randomly selected.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the least value of first entity in the relationship and the second entity ID value identifies the least value of those entity ID's related to the first entity. **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMinimumValue?: string;
    /**
     * The maximum relation value of the entire relations page.  This will be the same as `maximumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the maximum relation value of all the candidate relations on the page that were used for random sample selection even if that relation was not randomly selected.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the greatest value of first entity in the relationship and the second entity ID value identifies the greatest value of those entity ID's related to the first entity. **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMaximumValue?: string;
    /**
     * The total number of relationships representing the set of all  possible results across all pages.
     */
    totalRelationCount: number;
    /**
     * The number of relationships in the set that exist on pages before this page.
     */
    beforePageCount: number;
    /**
     * The number of relationships in the set that exist on pages after this page.
     */
    afterPageCount: number;
    /**
     * An array of `SzRelation`'s describing the relationships for the page. The `SzRelation` array will be in ascending order of the first  entity ID and then the second related entity ID.
     */
    relations: Array<SzSampleSetRelation>;
}
/**
 * Encapsulates a paged list of entity ID's identifying the entities pertaining to a specific statistic.
 */
export interface SzSampleSetEntitiesPage { 
    /**
     * The entity ID bound value that bounds the returned entity ID's.
     */
    bound: number;
    boundType: SzBoundType;
    /**
     * The requested page size representing the maximum number of  entities that were included in the page.
     */
    pageSize: number;
    /**
     * The requested sample size representing the number of entities to be randmonly selected from the page of results.
     */
    sampleSize?: number;
    /**
     * The minimum entity ID of the returned results.  **NOTE:** This field is absent or `null` if there are no results.
     */
    minimumValue?: number;
    /**
     * The maximum entity ID of the returned results.  **NOTE:** This field is absent or `null` if there are no results.
     */
    maximumValue?: number;
    /**
     * The minimum entity ID of the entire entity page.  This will  be the same as `minimumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the minimum entity ID value of all the candidate entities on the page that were used for random sample selection even if that entity was not randomly selected.  **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMinimumValue?: number;
    /**
     * The maximum entity ID of the entire entity page.  This will  be the same as `maximumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the maximum entity ID value of all the candidate entities on the page that were used for random sample selection even if that entity was not randomly selected.  **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMaximumValue?: number;
    /**
     * The total number of entities representing the set of all  possible results across all pages.
     */
    totalEntityCount: number;
    /**
     * The number of entities in the set that exist on pages before  this page.
     */
    beforePageCount: number;
    /**
     * The number of entities in the set that exist on pages after this page.
     */
    afterPageCount: number;
    /**
     * An array of `SzSampleSetEntity` instances describing the entities for the page. The array will be in ascending order of entity ID.
     */
    entities: Array<SzSampleSetEntity>;
}

export type SzSampleSetTableRowType = 'ENTITY' | 'ENTITY_RECORD' | 'RELATED' | 'RELATED_RECORD' | 'DEBUG' | 'DEBUG2';
export const SzSampleSetTableRowType = {
    ENTITY: 'ENTITY' as SzSampleSetTableRowType,
    ENTITY_RECORD: 'ENTITY_RECORD' as SzSampleSetTableRowType,
    DEBUG: 'DEBUG' as SzSampleSetTableRowType,
    DEBUG2: 'DEBUG2' as SzSampleSetTableRowType,
    RELATED: 'RELATED' as SzSampleSetTableRowType,
    RELATED_RECORD: 'RELATED_RECORD' as SzSampleSetTableRowType
};

export interface SzSampleSetEntityTableRow extends SzSdkResolvedEntity {
    /**
     * The data source code identifying the data source from  which the record was loaded.
     */
    DATA_SOURCE?: string;
    /**
     * The record ID that uniquely identifies the record within the data source from which it was loaded.
     */
    //recordId?: string;
    /**
     * The optional match key describing why the record merged into the entity to which it belongs.  This may be absent or `null` if this record belongs to a single-record entity or if it was the inital record of the first multi-record entity to which it belonged (even if it later re-resolved into a larger entity).
     */
    //matchKey?: string;
    /**
     * The optioanl principle identifying the resolution rule that was used to merge the record into the entity to which it belonss.  This may be absent or `null` if this record belongs to a single-record entity or if it was the inital record of the first multi-record entity to which it belonged (even if it later re-resolved into a larger entity).
     */
    //principle?: string;
    /**
     * the type of data construct this row represents
     */
    DATA_TYPE?: SzSampleSetTableRowType
}

export interface SzSampleSetRelationTableRow extends SzSdkEntityRecord {
    //export interface SzStatSampleEntityTableRow extends SzResolvedEntity, SzMatchedRecord {
    /**
     * the type of data construct this row represents
     */
    DATA_TYPE?: SzSampleSetTableRowType
}

export interface SzSampleSetEntityTableItem extends SzSampleSetEntity {
    //relatedEntities?: SzDataTableRelatedEntity[],
    relatedEntity?: SzDataTableRelatedEntity,
    recordCount?: number,
    records?: SzSdkEntityRecord[],
    rows?: SzSampleSetEntityTableRow[],
    dataType?: SzSampleSetTableRowType;
}

export interface SzDataTableEntity extends SzSdkResolvedEntity {
    rows?: SzSampleSetEntityTableRow[],
    dataType?: SzSampleSetTableRowType;
}
export interface SzDataTableRelatedEntity extends SzSdkRelatedEntity {
    rows?: SzSampleSetRelationTableRow[],
    dataType?: SzSampleSetTableRowType;
}
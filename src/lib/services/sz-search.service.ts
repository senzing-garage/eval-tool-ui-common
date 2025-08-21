import { Injectable } from '@angular/core';
import { forkJoin, Observable, Subject } from 'rxjs';
import { map, take, takeUntil, tap } from 'rxjs/operators';

import {
  SzEntityIdentifiers,
  SzDetailLevel,
  SzEntityIdentifier
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';
import { SzGrpcEngineService } from './grpc/engine.service';
import { SzGrpcConfigManagerService } from './grpc/configManager.service';
import { SzEngineFlags } from '@senzing/sz-sdk-typescript-grpc-web';
import { SzSdkEntityRecord, SzSdkEntityResponse, SzSdkFindNetworkResponse, SzSdkRelatedEntity, SzSdkResolvedEntity, SzSdkSearchResolvedEntity, SzSdkSearchResponse, SzSdkSearchResult } from '../models/grpc/engine';
import { SzSdkConfigAttr } from '../models/grpc/config';
import { SzResumeEntity, SzResumeRelatedEntity } from '../models/SzResumeEntity';
import { SzNetorkGraphCompositeResponse } from '../models/SzNetworkGraph';

export interface SzSearchEvent {
  params: SzEntitySearchParams,
  results: SzSdkSearchResult[]
}

@Injectable({
  providedIn: 'root'
})
export class SzSearchService {
  private currentSearchParams: SzEntitySearchParams = {};
  private currentSearchResults: SzSdkSearchResult[] | null = null;
  public parametersChanged = new Subject<SzEntitySearchParams>();
  public resultsChanged = new Subject<SzSdkSearchResult[]>();
  public searchPerformed = new Subject<SzSearchEvent>();

  constructor(
    private configManagerService: SzGrpcConfigManagerService,
    private engineService: SzGrpcEngineService,
    //private entityDataService: EntityDataService
    ) {}

  /**
   * perform a search request againt the data source.
   * @link http://editor.swagger.io/?url=https://raw.githubusercontent.com/Senzing/senzing-rest-api/master/senzing-rest-api.yaml | GET /entities
   *
   * @memberof SzSearchService
   */
  public searchByAttributes(searchParms: SzEntitySearchParams): Observable<SzSdkSearchResult[]> {
    this.currentSearchParams = searchParms;
    //const flags = SzEngineFlags.SZ_INCLUDE_FEATURE_SCORES |
    const flags = SzEngineFlags.SZ_SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS |
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_RELATIONS | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_ENTITY_NAME |
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_ENTITY_NAME |
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_RELATIONS |
    SzEngineFlags.SZ_ENTITY_INCLUDE_DISCLOSED_RELATIONS;

    //return this.entityDataService.searchByAttributes(attrs?: string, attr?: Array<string>, withRelationships?: boolean, featureMode?: string, withFeatureStats?: boolean, withDerivedFeatures?: boolean, forceMinimal?: boolean, withRaw?: boolean, observe?: 'body', reportProgress?: boolean): Observable<SzAttributeSearchResponse>;
    return this.engineService.searchByAttributes(JSON.stringify(searchParms), flags)
    .pipe(
      tap((searchRes) => console.log('SzSearchService.searchByAttributes: ', searchParms, searchRes)),
      map((searchRes) => (searchRes as SzSdkSearchResponse).RESOLVED_ENTITIES),
      //map((searchRes) => JSON.parse(searchRes).data.searchResults as SzSdkSearchResolvedEntity[]),
      tap((searchRes: SzSdkSearchResult[]) => {
        console.warn('SzSearchService.searchByAttributes 1: ', searchRes)
        this.searchPerformed.next({
          params: this.currentSearchParams,
          results: searchRes
        });
        //console.warn('SzSearchService.searchByAttributes 2: ', searchRes)
      })
    );
  }
  /**
   * get the current search params.
   *
   * @memberof SzSearchService
   */
  public getSearchParams(): SzEntitySearchParams {
    return this.currentSearchParams;
  }

  /**
   * set an individual search parameter.
   * @memberof SzSearchService
   */
  public setSearchParam(paramName: any, value: any): void {
    try {
      this.currentSearchParams[paramName] = value;
      this.parametersChanged.next(this.currentSearchParams);
    } catch(err) {}
  }

  /**
   * get the current search results from the last search.
   * @memberof SzSearchService
   */
  public getSearchResults() : SzSdkSearchResult[] | null {
    return this.currentSearchResults;
  }

  /**
   * set the current search results from the last search.
   * @memberof SzSearchService
   */
  public setSearchResults(results: SzSdkSearchResult[] | null) : void {
    this.currentSearchResults = results ? results : null;
    this.resultsChanged.next( this.currentSearchResults );
  }

  /**
   * clears out current search parameters and search results.
   * @memberof SzSearchService
   */
  public clearCurrentSearchState() : void {
    this.currentSearchParams  = {};
    this.currentSearchResults = null;
  }

  /**
   * @alias getAttributeTypes
  */
  public getMappingAttributes(): Observable<SzSdkConfigAttr[]> {
    return this.getAttributeTypes();
  }
  /**
   * get list of characteristics as attribute types
   *
   * @memberof SzSearchService
   */
  public getAttributeTypes(): Observable<SzSdkConfigAttr[]> {
    let _retSubject = new Subject<SzSdkConfigAttr[]>();
    let _retVal     = _retSubject.asObservable();Observable

    // get attributes
    this.configManagerService.config.then((conf) => {
      _retSubject.next(conf.attributes)
    })
    return _retVal;
  }

  /**
   * get an SzEntityData model by providing an entityId.
   *
   * @memberof SzSearchService
   */
  public getEntityById(entityId: SzEntityIdentifier, withRelated = false, detailLevel = SzDetailLevel.VERBOSE): Observable<SzSdkEntityResponse> {
    console.log('@senzing/sdk/services/sz-search[getEntityById('+ entityId +', '+ withRelated +')] ');
    const withRelatedStr = withRelated ? 'FULL' : 'NONE';
    const flags = SzEngineFlags.SZ_ENTITY_DEFAULT_FLAGS |
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_RELATIONS | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_ENTITY_NAME |
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_ENTITY_NAME |
    SzEngineFlags.SZ_ENTITY_INCLUDE_DISCLOSED_RELATIONS |
    SzEngineFlags.SZ_ENTITY_INCLUDE_POSSIBLY_RELATED_RELATIONS | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_RECORD_DATA | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_FEATURES | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_MATCHING_INFO;

    //return this.engineService.getEntityByEntityId((entityId as number), detailLevel, undefined, undefined, undefined, undefined, withRelatedStr)
    return this.engineService.getEntityByEntityId((entityId as number), flags)
    .pipe(
      tap((res: SzSdkEntityResponse) => console.log('SzSearchService.getEntityById: ' + entityId, res)),
      map((res: SzSdkEntityResponse) => (res as SzSdkEntityResponse))
    )
  }
  /** get the SzEntityData[] responses for multiple entities 
   * @memberof SzSearchService
   */
  public getEntitiesByIds(entityIds: SzEntityIdentifiers, withRelated = false, detailLevel = SzDetailLevel.VERBOSE): Observable<SzSdkEntityResponse[]> {
    console.log('@senzing/sdk/services/sz-search[getEntitiesByIds('+ entityIds +', '+ withRelated +')] ');
    const withRelatedStr = withRelated ? 'FULL' : 'NONE';
    let _retSubject = new Subject<SzSdkEntityResponse[]>();
    let _retVal     = _retSubject.asObservable();

    let _listOfObserveables = entityIds.map((eId) => {
      //return this.engineService.getEntityByEntityId(eId, detailLevel, undefined, undefined, undefined, undefined, withRelatedStr)
      return this.engineService.getEntityByEntityId(eId)
    })

    forkJoin(_listOfObserveables).pipe(
      map((res: SzSdkEntityResponse[]) => {
        return res.map((res: SzSdkEntityResponse) => (res as SzSdkEntityResponse))
      })
    )
    .subscribe((results: SzSdkEntityResponse[]) => {
      console.warn('@senzing/sdk/services/sz-search[getEntitiesByIds RESULT: ', results);
      _retSubject.next(results);
    })

    return _retVal;
  }

  public getResumeDataByEntityId(entityId: number) : Observable<SzResumeEntity> {
    const flags = SzEngineFlags.SZ_FIND_NETWORK_DEFAULT_FLAGS |
    SzEngineFlags.SZ_FIND_NETWORK_INCLUDE_MATCHING_INFO | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_RELATIONS | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_FEATURES |
    SzEngineFlags.SZ_ENTITY_INCLUDE_RECORD_DATA | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_MATCHING_INFO |
    //SzEngineFlags.SZ_INCLUDE_MATCH_KEY_DETAILS |
    SzEngineFlags.SZ_ENTITY_INCLUDE_RECORD_FEATURE_DETAILS | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_RECORD_DATA | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_ENTITY_NAME |
    SzEngineFlags.SZ_ENTITY_INCLUDE_DISCLOSED_RELATIONS |
    SzEngineFlags.SZ_ENTITY_INCLUDE_POSSIBLY_RELATED_RELATIONS;
    /*
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_RELATIONS | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_ENTITY_NAME |
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_ENTITY_NAME |
    SzEngineFlags.SZ_ENTITY_INCLUDE_DISCLOSED_RELATIONS |
    SzEngineFlags.SZ_ENTITY_INCLUDE_POSSIBLY_RELATED_RELATIONS | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_RECORD_DATA | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_FEATURES | 
    SzEngineFlags.SZ_ENTITY_INCLUDE_RELATED_MATCHING_INFO;*/

    return this.engineService.findNetworkByEntityId(entityId, 1, 1, 1000, flags).pipe(
      take(1),
      map((response: SzSdkFindNetworkResponse) => {
        let result: SzResumeEntity;
        let _primaryEntityResult = response.ENTITIES.find((item)=>{
          return (item.RESOLVED_ENTITY && item.RESOLVED_ENTITY.ENTITY_ID === entityId) 
        })
        if(_primaryEntityResult) {
          let fullRelated: SzResumeRelatedEntity[] = [];
          _primaryEntityResult.RELATED_ENTITIES.forEach((relEnt)=>{
            let resolvedEnt = Object.assign({
                "MATCH_LEVEL_CODE": relEnt.MATCH_LEVEL_CODE,
                "MATCH_KEY": relEnt.MATCH_KEY,
                "ERRULE_CODE": relEnt.ERRULE_CODE,
                "IS_DISCLOSED": relEnt.IS_DISCLOSED,
                "IS_AMBIGUOUS": relEnt.IS_AMBIGUOUS
            }, response.ENTITIES.find((expEnt)=>{
              return expEnt.RESOLVED_ENTITY.ENTITY_ID === relEnt.ENTITY_ID
            }).RESOLVED_ENTITY);
            fullRelated.push(resolvedEnt);
          })
          result = Object.assign({
            RELATED_ENTITIES: fullRelated,
            _related: _primaryEntityResult.RELATED_ENTITIES
          }, _primaryEntityResult.RESOLVED_ENTITY)
        }
        return result;
      })
    )
  }

  public getGraphNetworkData(entityIds: Array<string | number>, maxDegrees: number, buildOut: number, maxEntities: number): Observable<SzNetorkGraphCompositeResponse> {
    console.log(`!!!!!!!!!!!!!!!!! getNetworkCompositeGrpc !!!!!!!!!!!!!!!!!`);
    let returnSubject     = new Subject<SzNetorkGraphCompositeResponse>();
    let returnObserveable = returnSubject.asObservable();
    if(console.time){
      try {
        console.time('graph data')
      }catch(err){}
    }

    this.engineService.getGraphEntityNetwork(entityIds,
      maxDegrees,
      1,
      maxEntities
    ).pipe(
      tap(()=> {
        try {
          console.timeEnd('graph data')
        }catch(err){}
      }) 
    ).subscribe((resp) => {
      let originalData = Object.assign({}, (resp as SzNetorkGraphCompositeResponse));
      let _data = Object.assign({ modified: true }, (resp as SzNetorkGraphCompositeResponse));
      let primaryEntitiesById         = new Map<string | number, SzSdkResolvedEntity>();
      let relatedEntitiesById         = new Map<string | number, SzSdkRelatedEntity>();
      let relatedEntitiesByPrimaryId  = new Map<string | number, Map<string | number, SzSdkRelatedEntity>>();
      
      if(_data.ENTITY_RESPONSES && _data.ENTITY_RESPONSES.forEach) {
        _data.ENTITY_RESPONSES.forEach((_eResp)=>{
          if(_eResp.RESOLVED_ENTITY) {
            primaryEntitiesById.set(_eResp.RESOLVED_ENTITY.ENTITY_ID, _eResp.RESOLVED_ENTITY);
          }
          if(_eResp.RELATED_ENTITIES && _eResp.RELATED_ENTITIES.forEach) {
            let _relatedEntitiesByPrimaryId = new Map<string | number, SzSdkRelatedEntity>();
            _eResp.RELATED_ENTITIES.forEach((relEntity)=>{
              relatedEntitiesById.set(relEntity.ENTITY_ID, relEntity);
              _relatedEntitiesByPrimaryId.set(relEntity.ENTITY_ID, relEntity);
            })
            if(_relatedEntitiesByPrimaryId && _relatedEntitiesByPrimaryId.size > 0) {
              relatedEntitiesByPrimaryId.set(_eResp.RESOLVED_ENTITY.ENTITY_ID, _relatedEntitiesByPrimaryId);
            }
          }
        });
      }
      if(_data.NETWORK_RESPONSES && _data.NETWORK_RESPONSES.forEach) {
        _data.NETWORK_RESPONSES.forEach((_nResp)=>{
          if(_nResp.ENTITIES && _nResp.ENTITIES.forEach) {
            _nResp.ENTITIES = _nResp.ENTITIES.map((netEntity) => {
              if(primaryEntitiesById.has(netEntity.RESOLVED_ENTITY.ENTITY_ID)) {
                // this is a primary entity
                // SUPERSIZE IT!
                netEntity.RESOLVED_ENTITY   = Object.assign(netEntity.RESOLVED_ENTITY, primaryEntitiesById.get(netEntity.RESOLVED_ENTITY.ENTITY_ID));
                if(relatedEntitiesByPrimaryId.has(netEntity.RESOLVED_ENTITY.ENTITY_ID)) {
                  netEntity.RELATED_ENTITIES = netEntity.RELATED_ENTITIES ? 
                  netEntity.RELATED_ENTITIES : 
                  [...relatedEntitiesByPrimaryId.get(netEntity.RESOLVED_ENTITY.ENTITY_ID)]
                  .map(_relEntityByPrimary => { return _relEntityByPrimary[1] })
                }
              }
              if(relatedEntitiesById.has(netEntity.RESOLVED_ENTITY.ENTITY_ID)) {
                netEntity.RESOLVED_ENTITY = relatedEntitiesById.get(netEntity.RESOLVED_ENTITY.ENTITY_ID);
              }

              return netEntity;
            });
          }
        });
      }

      console.log(`!!!!!!!!!!!!!! getGraphEntityNetwork: SWEET !!!!!!!!!!!!!!`, originalData, _data );
      returnSubject.next(_data);
    });
    return returnObserveable;
  }

  /**
   * get an SzEntityRecord model by providing an datasource and record id.
   *
   * @memberof SzSearchService
   */
  public getRecordById(dsName: string, recordId: string | number, withRelated = false): Observable<SzSdkEntityRecord> {
    //console.log('@senzing/sdk/services/sz-search[getRecordById('+ dsName +', '+ recordId +')] ', dsName, recordId);
    const _recordId: string = recordId.toString();

    return this.engineService.getRecord(dsName, _recordId)
    .pipe(
      tap((res: SzSdkEntityRecord) => console.log('SzSearchService.getRecordById: ' + dsName, res))
    );
  }

  /**
   * get an SzEntityData model by providing an datasource and record id.
   *
   * @memberof SzSearchService
   */
   public getEntityByRecordId(dsName: string, recordId: string | number, withRelated = false, detailLevel = SzDetailLevel.SUMMARY): Observable<SzSdkEntityResponse> {
    console.log('@senzing/sdk/services/sz-search[getEntityByRecordId('+ dsName +', '+ recordId +')] ', dsName, recordId, detailLevel);
    const _recordId: string = recordId.toString();

    return this.engineService.getEntityByRecordId(dsName, _recordId)
    .pipe(
      map( (res: SzSdkEntityResponse) => (res as SzSdkEntityResponse))
    );
  }

}

import { Injectable, Output, EventEmitter } from '@angular/core';

import {
  EntityDataService,
  ConfigService,
  SzResolvedEntity,
  SzRelatedEntity,
  SzDataSourcesResponse,
  SzDataSourcesResponseData
} from '@senzing/rest-api-client-ng';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take, tap } from 'rxjs/operators';
import { SzGrpcConfigManagerService } from './grpc/configManager.service';
import { SzSdkDataSource } from '../models/grpc/config';

/**
 * Provides access to the /datasources api path.
 * See {@link https://github.com/senzing-garage/senzing-rest-api-specification/blob/main/senzing-rest-api.yaml#L172}
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzDataSourcesService {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _dataSourceDetails: SzDataSourcesResponseData | undefined;

  constructor(
      private configManagerService: SzGrpcConfigManagerService
  ) {}

  public getDataSources(debugPath?: string) {
    let retVal = new Subject<SzSdkDataSource[]>();
    this.configManagerService.config.then((conf)=> {
      conf.dataSources.pipe(
        takeUntil(this.unsubscribe$),
        take(1),
        tap( (data) => {
          console.log(`listDataSources(): ${debugPath ? debugPath : ''}`, data);
        })
      ).subscribe((dsResp: SzSdkDataSource[]) =>{
        retVal.next(dsResp);
      })
    });
    return retVal.asObservable();
  }

  /**
   * get an array of datasources.
   *
   * @memberof SzDataSourcesService
   */
  /*public listDataSources(debugPath?: string): Observable<string[]> {
    // get attributes
    return this.configManagerService.()
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data.dataSources ),
      tap( (data) => {
        console.log(`listDataSources(): ${debugPath ? debugPath : ''}`, data);
      })
    );
  }*/
  /**
   * get an array of datasources.
   *
   * @memberof SzDataSourcesService
   */
  /*public listDataSourcesDetails(debugPath?: string): Observable<SzDataSourcesResponseData> {
    // get attributes
    return this.configService.getDataSources()
    .pipe(
      map( (resp: SzDataSourcesResponse) => resp.data ),
      tap( (data) => {
        this._dataSourceDetails = data;
        console.log(`listDataSourcesDetails: ${debugPath ? debugPath : ''}`, data);
      })
    );
  }*/
  /**
   * add datasources and return a array of datasources after the operation.
   */
  public registerDataSources(dataSources: string[]): Observable<string[]> {
    let retVal = new Subject<string[]>();
    // first get current configs datasources to make sure were not 
    // trying to re-register
    if(dataSources.length > 0) {
      this.configManagerService.config.then((conf)=>{
        conf.dataSources.subscribe((registeredDataSources: SzSdkDataSource[])=> {
          let _registeredCodes  = registeredDataSources.map((rDs)=>{ return rDs.DSRC_CODE; });
          let _dataSourcesToAdd = dataSources.filter((dsToAdd)=> {
            return !_registeredCodes.includes(dsToAdd);
          });

          conf.registerDataSources(_dataSourcesToAdd).pipe(
            takeUntil(this.unsubscribe$)
          ).subscribe((resp) => {
            console.log(`added datasources: `, resp);
            console.log(`conf: `, conf.definition);
            this.configManagerService.setDefaultConfig(conf.definition).pipe(
              takeUntil(this.unsubscribe$)
            ).subscribe((newConfigId)=>{});
          });
        });
      });
    }
    return retVal.asObservable();
  }
}

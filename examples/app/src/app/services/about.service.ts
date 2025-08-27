import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, interval, from, of, EMPTY, Subject, BehaviorSubject } from 'rxjs';
import { AdminService, SzBaseResponse, SzMeta, SzVersionResponse, SzVersionInfo } from '@senzing/rest-api-client-ng';
import { switchMap, tap, takeWhile, map, take } from 'rxjs/operators';
import { version as appVersion, dependencies as appDependencies } from '../../../../../package.json';
//import { SzAdminService, SzServerInfo } from '@senzing/sdk-components-ng';
import { SzWebAppConfigService } from './config.service';
import { SzGrpcProductService, SzProductLicenseResponse, SzProductVersionResponse } from '@senzing/sz-sdk-components-grpc-web';

/**
 * Service to provide package and release versions of key
 * dependencies. used for diagnostics.
 */
@Injectable({
  providedIn: 'root'
})
export class AboutInfoService {
  private _productVersion: SzProductVersionResponse;
  private _productLicense: SzProductLicenseResponse;

  public get productName() {
    if(!this._productVersion) return undefined;
    return this._productVersion.PRODUCT_NAME;
  }
  public get version() {
    if(!this._productVersion) return undefined;
    return this._productVersion.VERSION;
  }
  public get build() {
    if(!this._productVersion) return undefined;
    return {
      version: this._productVersion.BUILD_VERSION,
      date: this._productVersion.BUILD_DATE,
      number: this._productVersion.BUILD_NUMBER
    }
  }
  public get compatibility () {
    if(!this._productVersion) return undefined;
    if(!this._productVersion.COMPATIBILITY_VERSION) return undefined;
    return {
      configVersion: this._productVersion.COMPATIBILITY_VERSION.CONFIG_VERSION
    }
  }
  public get schema() {
    if(!this._productVersion) return undefined;
    if(!this._productVersion.SCHEMA_VERSION) return undefined;
    return {
      engineSchemaVersion: this._productVersion.SCHEMA_VERSION.ENGINE_SCHEMA_VERSION,
      minimumRequiredSchemaVersion: this._productVersion.SCHEMA_VERSION.MINIMUM_REQUIRED_SCHEMA_VERSION,
      maximumRequiredSchemaVersion: this._productVersion.SCHEMA_VERSION.MAXIMUM_REQUIRED_SCHEMA_VERSION
    }
  }

  public get license() {
    return this._productLicense;
  }

  /** release version of the senzing-rest-api server being used */
  //public apiServerVersion: string;
  /** release version of the senzing-poc-api server being used */
  //public pocServerVersion: string;
  /** version of the OAS senzing-rest-api spec being used */
  //public restApiVersion: string;
  /** version of the OAS senzing-rest-api spec being used in the POC server*/
  //public pocApiVersion: string;
  /** release version of the ui app */
  public appVersion: string;
  /** release version of the @senzing/sz-sdk-components-grpc-web package*/
  public sdkComponentsVersion: string;
  /** version of the @senzing/sz-sdk-typescript-grpc-web package */
  public grpcClientVersion: string;
  /** version of the @senzing/serve-grpc instance */
  public grpcServerVersion: string;
  /** whether or not new data can be imported */
  public isReadOnly: boolean;
  /** whether or not the admin interface is made available */
  public isAdminEnabled: boolean;
  /** @internal */
  private pollingInterval = 60 * 1000;

  /** provide a event subject to notify listeners of updates */
  private _onServerInfoUpdated = new BehaviorSubject(this);
  public onServerInfoUpdated = this._onServerInfoUpdated.asObservable();

  /** poll for license info */
  public pollForLicenseInfo(): Observable<SzProductLicenseResponse> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.productService.getLicense() )),
        tap( this.setLicenseInfo.bind(this) )
    );
  }
  /** poll for version info */
  public pollForProductInfo(): Observable<SzProductVersionResponse> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.productService.getVersion() )),
        tap( this.setProductInfo.bind(this) )
    );
  }
  /** poll for server health */
  /*public pollForHeartbeat(): Observable<SzVersionInfo> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.adminService.getHeartbeat() )),
        takeWhile( (resp: SzMeta) => resp.httpStatusCode !== 403 && resp.httpStatusCode !== 500 ),
        tap( this.setHeartbeatInfo.bind(this) )
    );
  }*/
  /** poll for server info */
  /*public pollForServerInfo(): Observable<SzServerInfo> {
    return interval(this.pollingInterval).pipe(
        switchMap(() => from( this.adminService.getServerInfo() )),
        tap( this.setServerInfo.bind(this) )
    );
  }*/
  constructor(
    //private adminService: SzAdminService, 
    private configService: SzWebAppConfigService,
    private productService: SzGrpcProductService
  ) {
    this.appVersion = appVersion;
    if(appDependencies) {
      // check to see if we can pull sdk-components-grpc-web and sz-sdk-typescript-grpc-web
      // versions from the package json
      if (appDependencies['@senzing/sz-sdk-typescript-grpc-web']) {
        this.grpcClientVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/sz-sdk-typescript-grpc-web'], '@senzing/sz-sdk-typescript-grpc-web-' );
      }
      if (appDependencies['@senzing/sz-sdk-components-grpc-web']) {
        this.sdkComponentsVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/sz-sdk-components-grpc-web'], '@senzing/sz-sdk-components-grpc-web-' );
      }
      /*if (appDependencies['@senzing/rest-api-client-ng']) {
        this.restApiClientVersion = this.getVersionFromLocalTarPath( appDependencies['@senzing/rest-api-client-ng'], 'senzing-rest-api-client-ng-' );
      }*/
    }

    // get product info from serve-grpc
    this.getProductInfo().pipe(take(1)).subscribe( this.setProductInfo.bind(this) );
    this.getLicenseInfo().pipe(take(1)).subscribe( this.setLicenseInfo.bind(this) );
    this.pollForProductInfo().subscribe();
    //this.pollForHeartbeat().subscribe();
    this.pollForLicenseInfo().subscribe();

    /*this.configService.onApiConfigChange.subscribe(() => {
      console.warn('AboutInfoService() config updated, making new info calls..');
      this.getVersionInfo().pipe(take(1)).subscribe( this.setVersionInfo.bind(this) );
      this.getServerInfo().pipe(take(1)).subscribe( this.setServerInfo.bind(this) );
      this.getServerInfoMetadata().pipe(take(1)).subscribe( this.setPocServerInfo.bind(this) );
    });*/
  }

  /** get heartbeat information from the rest-api-server host */
  /*public getHealthInfo(): Observable<SzMeta> {
    // get heartbeat
    return this.adminService.getHeartbeat();
  }*/
  /** get license information from serve-grpc */
  public getLicenseInfo(): Observable<SzProductLicenseResponse> {
    // get license info
    return this.productService.getLicense();
  }
  /** get product information from serve-grpc */
  public getProductInfo(): Observable<SzProductVersionResponse> {
    // get product info
    return this.productService.getVersion();
  }
  /** get the server information from the serve-grpc host */
  /*public getServerInfo(): Observable<SzServerInfo> {
    return this.adminService.getServerInfo();
  }*/

  
  public getVersionFromLocalTarPath(packagePath: string | undefined, packagePrefix?: string | undefined ): undefined | string {
    let retVal = packagePath;
    if (packagePath && packagePath.indexOf && packagePath.indexOf('file:') === 0) {
      const pathArr = packagePath.split('/');
      const fileName = pathArr.pop();
      if (fileName && fileName.indexOf && fileName.indexOf('.tgz') > -1) {
        let startAt = 0;
        if(packagePrefix && fileName.indexOf(packagePrefix) > -1) {
          startAt = fileName.indexOf(packagePrefix) + packagePrefix.length;
        }
        retVal = fileName.substring(startAt, fileName.indexOf('.tgz'));
      } else if (fileName) {
        retVal = fileName;
      }
    }
    return retVal;
  }
  private setLicenseInfo(response: SzProductLicenseResponse) {
    this._productLicense = response;
  }
  private setProductInfo(response: SzProductVersionResponse) {
    this._productVersion = response;
  }
  /*private setServerInfo(info: SzServerInfo) {
    //this.concurrency = info.concurrency;
    //this.activeConfigId = info.activeConfigId;
    //this.dynamicConfig = info.dynamicConfig;
    this.isReadOnly               = info.readOnly;
    this.isAdminEnabled           = info.adminEnabled;
    this.infoQueueConfigured      = info && info.infoQueueConfigured !== undefined ? info.infoQueueConfigured : this.infoQueueConfigured;
    this.loadQueueConfigured      = info && info.loadQueueConfigured !== undefined ? info.loadQueueConfigured : this.loadQueueConfigured;
    this.webSocketsMessageMaxSize = info && info.webSocketsMessageMaxSize !== undefined ? info.webSocketsMessageMaxSize : this.webSocketsMessageMaxSize;
    this._onServerInfoUpdated.next(this);
  }

  private setPocServerInfo(resp: SzMeta) {
    this.pocServerVersion     = resp && resp.pocServerVersion ? resp.pocServerVersion : this.pocApiVersion;
    this.pocApiVersion        = resp && resp.pocApiVersion ? resp.pocApiVersion : this.pocApiVersion;
    this.isPocServerInstance  = resp && resp.pocApiVersion !== undefined ? true : this.isPocServerInstance;
    this._onServerInfoUpdated.next(this);
  }

  private setVersionInfo(serverInfo: SzVersionInfo): void {
    this.apiServerVersion           = serverInfo.apiServerVersion;
    this.configCompatibilityVersion = serverInfo.configCompatibilityVersion;
    this.nativeApiVersion           = serverInfo.nativeApiVersion;
    this.restApiVersion             = serverInfo.restApiVersion;
    this.nativeApiBuildNumber       = serverInfo.nativeApiBuildNumber;
    this.nativeApiBuildDate         = serverInfo.nativeApiBuildDate;
  }
  */
}

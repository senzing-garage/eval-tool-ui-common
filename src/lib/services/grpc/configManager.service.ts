import { Inject, Injectable, signal } from '@angular/core';
import { SzGrpcWebConfig, SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from '@senzing/sz-sdk-typescript-grpc-web';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { SzProductLicenseResponse, SzProductVersionResponse } from '../../../lib/models/grpc/product';
import { SzGrpcConfig } from './config.service';
import { SzSdkConfigAttr, SzSdkConfigFeatureType, SzSdkConfigJson } from '../../models/grpc/config';
import { SzAttrClass, SzFeatureType } from '../../models/SzFeatureTypes';

@Injectable({
  providedIn: 'root'
})
export class SzGrpcConfigManagerService {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$     = new Subject<void>();
    public _defaultConfigId: number;
    private _config: SzGrpcConfig;
    public attrs: SzSdkConfigAttr[];
    public featureTypes: SzSdkConfigFeatureType[];
    public fTypeToAttrClassMap: Map<SzFeatureType, SzAttrClass | SzAttrClass[]>;

    public get defaultConfigId(): number {
        return this._defaultConfigId;
    }

    get config(): Promise<SzGrpcConfig> {
        let retVal = new Promise<SzGrpcConfig>((resolve, reject)=>{
            if(!this._config) {
                this.szGrpcEnvironment?.configManager?.getDefaultConfigId().then((resp: number) => {
                    this._defaultConfigId = resp;
                    this.createConfig(this.defaultConfigId).pipe(
                        take(1),
                        takeUntil(this.unsubscribe$)
                    ).subscribe((conf)=>{
                        this._config = conf;
                        this.attrs                  = SzGrpcConfigManagerService.getAttrs(this._config);
                        this.featureTypes           = SzGrpcConfigManagerService.getFeatures(this._config);
                        this.fTypeToAttrClassMap    = SzGrpcConfigManagerService.getFTypeToAttrClassMap(this.attrs);
                        resolve(this._config);
                    });
                });
            } else {
                resolve(this._config);
            }
        })
        return retVal;
    }
    public get features(): Observable<SzSdkConfigFeatureType[]> {
        let retSub  = new Subject<SzSdkConfigFeatureType[]>();
        this.config.then((config: SzGrpcConfig)=> {
            let _retVal = SzGrpcConfigManagerService.getFeatures(this._config);
            retSub.next(_retVal);
        });
        return retSub.asObservable();
    }
    public getConfigRegistry(): Subject<string> {
        let retVal = new Subject<string>();
        console.log(`getting configid's from grpc...`);
        if(this.szGrpcEnvironment && this.szGrpcEnvironment.configManager) {
          this.szGrpcEnvironment?.configManager?.getConfigRegistry().then((resp: string) => {
            retVal.next(resp);
          }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public getDefaultConfigId(): Subject<number> {
        let retVal = new Subject<number>();
        console.log(`getting default configid from grpc...`);
        if(this.szGrpcEnvironment && this.szGrpcEnvironment.configManager) {
          this.szGrpcEnvironment?.configManager?.getDefaultConfigId().then((resp: number) => {
            this._defaultConfigId = resp;
            retVal.next(resp);
          }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public createConfig();
    public createConfig(configId: number)
    public createConfig(configId?: number) {
        let retVal = new Subject<SzGrpcConfig>();
        if(this.szGrpcEnvironment && this.szGrpcEnvironment.configManager) {
            this.szGrpcEnvironment?.configManager?.createConfig(configId).then((conf) => {
                this._config                = new SzGrpcConfig(conf);
                this.attrs                  = SzGrpcConfigManagerService.getAttrs(this._config);
                this.featureTypes           = SzGrpcConfigManagerService.getFeatures(this._config);
                this.fTypeToAttrClassMap    = SzGrpcConfigManagerService.getFTypeToAttrClassMap(this.attrs);
                retVal.next(this._config);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public registerConfig(configDefinition: string, comment?: string) {
        let retVal = new Subject<number>();
        if(this.szGrpcEnvironment && this.szGrpcEnvironment.configManager) {
            this.szGrpcEnvironment?.configManager.registerConfig(configDefinition, comment).then((resp) => {
                retVal.next(resp);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public setDefaultConfig(configDefinition: string);
    public setDefaultConfig(configDefinition: string, comment: string);
    public setDefaultConfig(configDefinition: string, comment?: string) {
        let retVal = new Subject<number>();
        if(this.szGrpcEnvironment && this.szGrpcEnvironment.configManager) {
            this.szGrpcEnvironment?.configManager.setDefaultConfig(configDefinition, comment).then((resp) => {
                retVal.next(resp);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number) {
        let retVal = new Subject<string>();
        if(this.szGrpcEnvironment && this.szGrpcEnvironment.configManager) {
            this.szGrpcEnvironment?.configManager.replaceDefaultConfigId(currentDefaultConfigId, newDefaultConfigId).then((resp) => {
                retVal.next(resp);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    constructor(
        // Make GRPC Environment an injection token
        @Inject('GRPC_ENVIRONMENT') private szGrpcEnvironment: SzGrpcWebEnvironment
    ) {
        // get the default config
        this.config.then((config)=>{
            if(this.attrs) {
                let fTypeToClassMap = SzGrpcConfigManagerService.getFTypeToAttrClassMap(this.attrs);
            }
        })
    }

    // ------------------------------ static/util methods ------------------------------

    public static getAttrs(config: SzGrpcConfig): SzSdkConfigAttr[] {
        let retVal = [];
        if(config && config.definition) {
            let cfgJson = (JSON.parse(config.definition) as SzSdkConfigJson).G2_CONFIG;
            if(cfgJson.CFG_ATTR) {
                retVal = cfgJson.CFG_ATTR;
            }
        }
        return retVal;
    }

    public static getFeatures(config: SzGrpcConfig): SzSdkConfigFeatureType[] {
        let retVal = [];
        if(config && config.definition) {
            let cfgJson = (JSON.parse(config.definition) as SzSdkConfigJson).G2_CONFIG;
            if(cfgJson.CFG_FTYPE) {
                retVal = cfgJson.CFG_FTYPE;
            }
        }
        return retVal;
    }

    public static getAttrClassFromFeatureTypeCode(fTypeCode: string, attrs: SzSdkConfigAttr[]) {
        let retVal;
        let attrsMatchingFtype = attrs.filter((attr) => {
            return attr.FTYPE_CODE === fTypeCode;
        });
        let attrsToClasses = attrsMatchingFtype.map((attr: SzSdkConfigAttr)=>{
            return attr.ATTR_CLASS;
        });
        if(attrsToClasses && attrsToClasses.length) retVal = [...new Set(attrsToClasses)];
        return retVal;
    }

    private static getFTypeToAttrClassMap(attrs: SzSdkConfigAttr[]): Map<SzFeatureType, SzAttrClass | SzAttrClass[]> {
        let expVal      = new Map<SzFeatureType, SzAttrClass[]>();
        let retVal      = new Map<SzFeatureType, SzAttrClass | SzAttrClass[]>();

        attrs.forEach((attr) => {
            let fTypeCode = attr.FTYPE_CODE ? attr.FTYPE_CODE as SzFeatureType : "OTHER" as SzFeatureType;
            let attrClass = attr.ATTR_CLASS;
            let _v = expVal.has(fTypeCode) ? expVal.get(fTypeCode) : [];
            if(!_v.includes(attrClass)) { _v.push(attr.ATTR_CLASS); }
            expVal.set(fTypeCode, _v);
            if(!attr.FTYPE_CODE){
                // add a separate entry where the "ATTR_CODE" is the key
                expVal.set(attr.ATTR_CODE as SzFeatureType, [attrClass]);
            }
            
        });
        // flatten array
        let entriesIterator = expVal.entries();
        for(const [key, values] of entriesIterator) {
            let _v = values && values.length == 1 ? values[0]: values;
            retVal.set(key, _v);
        }
        return retVal;
    }
}
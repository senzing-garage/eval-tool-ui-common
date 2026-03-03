import { SzSdkConfigAttr } from "../models/grpc/config";
import { SzSdkEntityFeature, SzSdkEntityRecord, SzSdkRecordFeature, SzSdkRecordFeatures, SzSdkSearchResolvedEntity } from "../models/grpc/engine";
import { SzAttrClass, SzFeatureType } from "../models/grpc/SzFeatureTypes";
import { SzGrpcConfigManagerService } from "../services/grpc/configManager.service";
import { SzResumeEntity } from "../models/SzResumeEntity";


export function getStringEntityFeatures(features: {
   [key: string] : SzSdkEntityFeature[]
}, groupByAttributeClass = false, fTypeToAttrClassMap?: Map<string, SzAttrClass | SzAttrClass[]>, includeUsageType?: boolean, includeFeatureType?: boolean): Map<string, string[]> {
    let retMap = new Map<string, string[]>();
    for(let fTypeCode in features){
        let groupKey = (groupByAttributeClass && fTypeToAttrClassMap && fTypeToAttrClassMap.has(fTypeCode)) ? fTypeToAttrClassMap.get(fTypeCode) as SzAttrClass : fTypeCode;
        /*if(groupByAttributeClass && fTypeToAttrClassMap && fTypeToAttrClassMap.has(fTypeCode)) {
            // get attribute class(es) by fTypeCode
            let attrClassesForFType = SzGrpcConfigManagerService.getAttrClassFromFeatureTypeCode(fTypeCode, attributes);
            if(attrClassesForFType) {
                if(attrClassesForFType.length == 1) {
                    groupKey = attrClassesForFType[0];
                } else {
                    console.warn(`more than 1 ATTR_CLASS result for "${fTypeCode}"`, attrClassesForFType);
                }
            }
        }*/
        let _values     = retMap.has(groupKey) ? retMap.get(groupKey) : [];
        let _featValues = features[fTypeCode];
        if(!_featValues || !Array.isArray(_featValues)) continue;
        _featValues.forEach((feat)=> {
            if(!feat.FEAT_DESC_VALUES) return;
            feat.FEAT_DESC_VALUES.forEach((featDesc)=>{
                let _fVal = featDesc.FEAT_DESC;
                if(includeUsageType && feat.USAGE_TYPE) {
                    _fVal = `${feat.USAGE_TYPE}: ${featDesc.FEAT_DESC}`;
                } else if(includeFeatureType) {
                    _fVal = `${fTypeCode}: ${featDesc.FEAT_DESC}`;
                }
                _values.push(_fVal);
            })
        });
        retMap.set(groupKey, _values);
    }
    return retMap;
}

export function getStringRecordFeatures(features: SzSdkRecordFeatures, groupByAttributeClass = false, fTypeToAttrClassMap?: Map<string, SzAttrClass | SzAttrClass[]>, includeUsageType?: boolean, includeFeatureType?: boolean): Map<string, string[]> {
    let retMap = new Map<string, string[]>();
    for(let fTypeCode in features){
        let groupKey = (groupByAttributeClass && fTypeToAttrClassMap && fTypeToAttrClassMap.has(fTypeCode)) ? fTypeToAttrClassMap.get(fTypeCode) as SzAttrClass : fTypeCode;
        let _values     = retMap.has(groupKey) ? retMap.get(groupKey) : [];
        let _featValues = features[fTypeCode];
        if(!_featValues || !Array.isArray(_featValues)) continue;
        _featValues.forEach((feat: SzSdkRecordFeature) => {
            if(!feat.FEAT_DESC) return;
            let _fVal = feat.FEAT_DESC;
            if(includeUsageType && feat.USAGE_TYPE) {
                _fVal = `${feat.USAGE_TYPE}: ${feat.FEAT_DESC}`;
            } else if(includeFeatureType) {
                _fVal = `${fTypeCode}: ${feat.FEAT_DESC}`;
            }
            _values.push(_fVal);
        });
        retMap.set(groupKey, _values);
    }
    return retMap;
}

export function getEntityFeaturesByType(features: {
    [key: string] : SzSdkEntityFeature[]
 }, fTypeToAttrClassMap: Map<SzFeatureType, SzAttrClass | SzAttrClass[]>): Map<SzFeatureType, SzSdkEntityFeature[]> {
     let retMap = new Map<SzFeatureType, SzSdkEntityFeature[]>();
     for(let fTypeCode in features){
        let _fTypeCodeAsType = fTypeCode as SzFeatureType;
         let groupKey = (fTypeToAttrClassMap && fTypeToAttrClassMap.has(_fTypeCodeAsType)) ? fTypeToAttrClassMap.get(_fTypeCodeAsType) as SzAttrClass : _fTypeCodeAsType;
         let _values     = retMap.has(groupKey) ? retMap.get(groupKey) : [];
         let _featValues = features[fTypeCode];
         if(!_featValues || !Array.isArray(_featValues)) continue;
         _featValues.forEach((feat)=> {
            let _fVal = feat;
            if(!_fVal.LABEL) { _fVal.LABEL = fTypeCode; }
            _values.push(feat);
         });
         retMap.set(groupKey, _values);
     }
     return retMap;
 }



/**
 * Extracts unmapped passthrough fields from a record's JSON_DATA by subtracting
 * all keys that are mapped to Senzing features (via ATTRIBUTES), structural keys
 * (DATA_SOURCE, RECORD_ID), and usage-type keys (e.g. ADDR_TYPE).
 * Returns an array of {key, value} pairs.
 */
export function getUnmappedJsonDataFields(record: SzSdkEntityRecord): {key: string, value: string}[] {
    if (!record?.JSON_DATA || !record?.FEATURES) return [];
    const mappedKeys = new Set<string>(['DATA_SOURCE', 'RECORD_ID']);
    const usageTypeValues = new Set<string>();
    for (const fTypeCode in record.FEATURES) {
        const featArray = (record.FEATURES as any)[fTypeCode];
        if (!Array.isArray(featArray)) continue;
        for (const feat of featArray as SzSdkRecordFeature[]) {
            if (feat.ATTRIBUTES) {
                for (const attrKey of Object.keys(feat.ATTRIBUTES)) {
                    mappedKeys.add(attrKey);
                }
            }
            if (feat.USAGE_TYPE) {
                usageTypeValues.add(feat.USAGE_TYPE);
            }
        }
    }
    const result: {key: string, value: string}[] = [];
    for (const [key, value] of Object.entries(record.JSON_DATA)) {
        if (mappedKeys.has(key)) continue;
        if (key.endsWith('_TYPE') && usageTypeValues.has(value as string)) continue;
        result.push({ key, value: String(value) });
    }
    return result;
}

export function bestEntityName(entity: SzResumeEntity | SzSdkSearchResolvedEntity): string {
    let retVal = undefined;
    if(entity && (entity as SzResumeEntity).BEST_NAME) {
        retVal = (entity as SzResumeEntity).BEST_NAME;
    }    
    if(entity && (entity as SzSdkSearchResolvedEntity).ENTITY_NAME) {
        retVal = (entity as SzSdkSearchResolvedEntity).ENTITY_NAME;
    }
    return retVal;
}
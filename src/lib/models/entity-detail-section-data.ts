import { SzSdkEntityRecord, SzSdkEntityFeature, SzSdkEntityRecordSummary, SzSdkRelatedEntity, SzSdkResolvedEntity } from './grpc/engine';

export interface SzSectionDataByDataSource {
  'dataSource'?: string;
  'records'?: SzSdkEntityRecord[] | SzSdkRelatedEntity[]
}

export interface SzEntityDetailSectionData extends SzSdkResolvedEntity {
  'resolutionRuleCode': string;
  'matchLevel': number;
  'refScore': number;
  'matchKey': string;
  'recordSummaries': SzSdkEntityRecordSummary[];
  'identifierData': string[];
  'records': SzSdkEntityRecord[];
  'features'?: {
    [key: string] : SzSdkEntityFeature[]
  }
  'bestName': string;
  'characteristicData': string[];
  'phoneData': string[];
  'nameData': string[];
  'lensId': number;
  'entityId': number;
  'addressData': string[];
  'dataSource'?: string;
}

export interface SzEntityDetailSectionSummary {
  total: number;
  title: string;
}

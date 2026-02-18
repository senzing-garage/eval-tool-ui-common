import { SzSdkWhyFeatureScore, SzSdkWhyCandidateKey, SzSdkWhyFocusRecord } from './grpc/why';
import { SzSdkEntityFeature } from './grpc/engine';

/** Row definition for the why report table */
export interface SzWhyGrpcFeatureRow {
    key: string;
    title: string;
}

/** Extended entity feature with attached scoring details (for why-not comparison) */
export interface SzSdkEntityFeatureWithScoring extends SzSdkEntityFeature {
    scoringDetails?: SzSdkWhyFeatureScore;
    featureScores?: SzSdkWhyFeatureScore[];
}

/** HTML fragment descriptor used for rendering */
export interface SzWhyGrpcHTMLFragment {
    src: string;
    tagName: string;
    cssClasses: string[];
}

/** A column of data in the why report table (one per result/entity) */
export interface SzWhyGrpcEntityColumn {
    internalId?: number;
    entityId?: number;
    dataSources?: string[];
    focusRecords?: SzSdkWhyFocusRecord[];
    whyResult?: { key: string; rule: string };
    rows?: {
        [key: string]: any;
    };
    formattedRows?: {
        [key: string]: string | string[] | SzWhyGrpcHTMLFragment | SzWhyGrpcHTMLFragment[];
    };
    /** entity features from the resolved entity (used in why-not transform) */
    features?: { [key: string]: SzSdkEntityFeature[] };
}

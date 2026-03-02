import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Observable, Subject, takeUntil, throwError, zip } from 'rxjs';
import { SzEngineFlags } from '@senzing/sz-sdk-typescript-grpc-web';

import { getMapFromMatchKey } from '../common/utils';
import { SzGrpcConfigManagerService } from '../services/grpc/configManager.service';
import { SzGrpcEngineService } from '../services/grpc/engine.service';
import { SzCSSClassService } from '../services/sz-css-class.service';
import { SzWhyReportBaseGrpcComponent } from './sz-why-report-base-grpc.component';
import { SzSdkEntityFeature } from '../models/grpc/engine';
import {
    SzSdkWhyEntitiesResponse,
    SzSdkWhyEntitiesResult,
    SzSdkWhyEntityData,
    SzSdkWhyFeatureScore,
    SzSdkWhyCandidateKey,
    SzSdkWhyFocusRecord
} from '../models/grpc/why';
import {
    SzWhyGrpcFeatureRow,
    SzWhyGrpcEntityColumn,
    SzWhyGrpcHTMLFragment,
    SzSdkEntityFeatureWithScoring
} from '../models/data-why-grpc';

@Component({
    selector: 'sz-why-entities-grpc',
    templateUrl: './sz-why-entities-grpc.component.html',
    styleUrls: ['./sz-why-entities-grpc.component.scss'],
    imports: [CommonModule]
})
export class SzWhyEntitiesGrpcComponent extends SzWhyReportBaseGrpcComponent implements OnInit, OnDestroy {
    protected override _data: SzSdkWhyEntitiesResult;
    protected override _rows: SzWhyGrpcFeatureRow[] = [
        { key: 'ENTITY_ID', title: 'Entity ID' },
        { key: 'DATA_SOURCES', title: 'Data Sources' },
        { key: 'WHY_RESULT', title: 'Why Result' }
    ];

    @Input() entityIds: number[];
    @Output() onResult: EventEmitter<SzSdkWhyEntitiesResult> = new EventEmitter<SzSdkWhyEntitiesResult>();
    @Output() onEntitiesChanged: EventEmitter<SzSdkWhyEntityData[]> = new EventEmitter<SzSdkWhyEntityData[]>();

    constructor(
        override configManagerService: SzGrpcConfigManagerService,
        override engineService: SzGrpcEngineService) {
        super(configManagerService, engineService);
    }

    override ngOnInit() {
        this._isLoading = true;
        this.loading.emit(true);
        zip(
            this.getData(),
            this.getOrderedFeatures()
        ).pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe({
            next: this.onDataResponse.bind(this),
            error: (err) => {
                this._isLoading = false;
                if (err && err.url && err.url.indexOf && err.url.indexOf('configs/active') > -1) {
                    this._isLoading = true;
                    this.getData().pipe(
                        takeUntil(this.unsubscribe$)
                    ).subscribe((res) => {
                        this.onDataResponse([res, undefined]);
                    });
                }
            }
        });
    }

    protected override get renderers() {
        let _retVal = this._renderers;
        let fBId = this._featureStatsById;
        let _colors = { 'CLOSE': 'green', 'SAME': 'green', 'NO_CHANCE': 'red', 'PLAUSIBLE': 'yellow', 'UNLIKELY': 'yellow' };
        let featureIsInMatchKey = (f: string, mk: string): boolean => {
            f = (f === 'SURNAME') ? 'NAME' : f;
            let _r = false;
            if (mk) {
                _r = mk.indexOf(f) > -1;
            }
            return _r;
        };
        let sortByScore = (data: (SzSdkWhyFeatureScore | SzSdkEntityFeatureWithScoring | SzSdkWhyCandidateKey)[]) => {
            data = data.sort((rowA, rowB) => {
                let rowAScore: number;
                let rowBScore: number;
                let rowAAsScoring = (rowA as SzSdkEntityFeatureWithScoring);
                let rowBAsScoring = (rowB as SzSdkEntityFeatureWithScoring);
                if (rowAAsScoring.scoringDetails) {
                    rowAScore = rowAAsScoring.scoringDetails.SCORE;
                } else {
                    rowAScore = (rowA as SzSdkWhyFeatureScore).SCORE;
                }
                if (rowBAsScoring.scoringDetails) {
                    rowBScore = rowBAsScoring.scoringDetails.SCORE;
                } else {
                    rowBScore = (rowB as SzSdkWhyFeatureScore).SCORE;
                }
                if (rowAScore !== undefined && rowBScore !== undefined) {
                    return rowBScore - rowAScore;
                }
                return -1;
            });
            return data;
        };
        let addFeatureToResult = (_feat: any, _scoreDetails: SzSdkWhyFeatureScore, _entityFeatDetails: { LIB_FEAT_ID: number; FEAT_DESC: string }[], mk?: string, fieldName?: string, valuesAlreadyAdded?: string[]) => {
            let valueAdded: string;
            let _retStr = '';
            let featIsInScore = true;
            let stats;
            let featureIsScore = (_feat as SzSdkWhyFeatureScore).INBOUND_FEAT_ID ? true : false;
            let detailIds = _entityFeatDetails.map((fd) => fd.LIB_FEAT_ID);
            let idsInScore: number[] = [];
            if (_scoreDetails) {
                if (_scoreDetails.CANDIDATE_FEAT_ID) idsInScore.push(_scoreDetails.CANDIDATE_FEAT_ID);
                if (_scoreDetails.INBOUND_FEAT_ID) idsInScore.push(_scoreDetails.INBOUND_FEAT_ID);
            }
            let candidateIsInDetails = false;
            let inboundIsInDetails = false;
            if (featureIsScore) {
                stats = fBId && fBId.has((_feat as SzSdkWhyFeatureScore).INBOUND_FEAT_ID) ? fBId.get((_feat as SzSdkWhyFeatureScore).INBOUND_FEAT_ID) : false;
                candidateIsInDetails = detailIds.indexOf((_feat as SzSdkWhyFeatureScore).CANDIDATE_FEAT_ID) > -1;
                inboundIsInDetails = detailIds.indexOf((_feat as SzSdkWhyFeatureScore).INBOUND_FEAT_ID) > -1;
            } else {
                featIsInScore = idsInScore.indexOf((_feat as { LIB_FEAT_ID: number }).LIB_FEAT_ID) > -1;
                stats = fBId && fBId.has((_feat as { LIB_FEAT_ID: number }).LIB_FEAT_ID) ? fBId.get((_feat as { LIB_FEAT_ID: number }).LIB_FEAT_ID) : false;
            }
            let c = _scoreDetails &&
                ((valuesAlreadyAdded && valuesAlreadyAdded.length === 0) || !valuesAlreadyAdded) &&
                _colors[_scoreDetails.SCORING_BUCKET] &&
                featIsInScore &&
                featureIsInMatchKey(fieldName, mk) ? 'color-' + _colors[_scoreDetails.SCORING_BUCKET] : '';
            let sb = (_scoreDetails && _scoreDetails.SCORING_BUCKET) ? `score-${_scoreDetails.SCORING_BUCKET}` : '';

            let featureValue: string;
            let externalVal: string;
            if (featureIsScore) {
                let f = (_feat as SzSdkWhyFeatureScore);
                let hasExternalValue = !candidateIsInDetails || !inboundIsInDetails;
                if (hasExternalValue) {
                    if (candidateIsInDetails && !inboundIsInDetails) {
                        featureValue = f.CANDIDATE_FEAT_DESC;
                        externalVal = f.INBOUND_FEAT_DESC;
                    } else if (!candidateIsInDetails && inboundIsInDetails) {
                        featureValue = f.INBOUND_FEAT_DESC;
                        externalVal = f.CANDIDATE_FEAT_DESC;
                    } else {
                        externalVal = f.INBOUND_FEAT_DESC;
                    }
                } else {
                    featureValue = f.INBOUND_FEAT_DESC;
                }
            } else {
                featureValue = (_feat as { FEAT_DESC: string }).FEAT_DESC;
            }

            if ((valuesAlreadyAdded && valuesAlreadyAdded.indexOf(featureValue) === -1) || !valuesAlreadyAdded) {
                if (_scoreDetails && ((valuesAlreadyAdded && valuesAlreadyAdded.length === 0) || !valuesAlreadyAdded)) {
                    _retStr += `<div class="ws-nowrap line-text ${sb} ${c}">`;
                    if (featIsInScore) {
                        valueAdded = featureValue;
                        _retStr += featureValue;
                        if (stats && stats.statistics && stats.statistics.entityCount) {
                            _retStr += ` [${stats.statistics.entityCount}]`;
                        }
                        if (['SAME', 'CLOSE', 'PLAUSIBLE'].indexOf(_scoreDetails.SCORING_BUCKET) > -1 && externalVal) {
                            _retStr += '\n<div><span class="child-node"></span>';
                            _retStr += externalVal;
                        }
                    } else {
                        valueAdded = featureValue;
                        _retStr += featureValue;
                        if (stats && stats.statistics && stats.statistics.entityCount) {
                            _retStr += ` [${stats.statistics.entityCount}]`;
                        }
                    }
                    if (_scoreDetails.NAME_SCORING_DETAILS) {
                        let _nameScoreValues = [];
                        if (_scoreDetails.NAME_SCORING_DETAILS.FULL_SCORE) { _nameScoreValues.push(`full:${_scoreDetails.NAME_SCORING_DETAILS.FULL_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.ORG_NAME_SCORE) { _nameScoreValues.push(`org:${_scoreDetails.NAME_SCORING_DETAILS.ORG_NAME_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.GIVEN_NAME_SCORE) { _nameScoreValues.push(`giv:${_scoreDetails.NAME_SCORING_DETAILS.GIVEN_NAME_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.SURNAME_SCORE) { _nameScoreValues.push(`sur:${_scoreDetails.NAME_SCORING_DETAILS.SURNAME_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.GENERATION_MATCH_SCORE) { _nameScoreValues.push(`gen:${_scoreDetails.NAME_SCORING_DETAILS.GENERATION_MATCH_SCORE}`); }
                        _retStr += (_nameScoreValues.length > 0 ? ` (${_nameScoreValues.join('|')})` : '');
                    } else if (_scoreDetails && _scoreDetails.SCORE > -1) {
                        _retStr += ` (${_scoreDetails.SCORE})`;
                    }
                    if (['SAME', 'CLOSE', 'PLAUSIBLE'].indexOf(_scoreDetails.SCORING_BUCKET) > -1) {
                        _retStr += '</div>\n';
                    }
                    _retStr += '</div>\n';
                } else {
                    valueAdded = featureValue;
                    _retStr += '<div class="ws-nowrap line-text">' + featureValue;
                    if (_scoreDetails && _scoreDetails.NAME_SCORING_DETAILS) {
                        let _nameScoreValues = [];
                        if (_scoreDetails.NAME_SCORING_DETAILS.FULL_SCORE) { _nameScoreValues.push(`full:${_scoreDetails.NAME_SCORING_DETAILS.FULL_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.ORG_NAME_SCORE) { _nameScoreValues.push(`org:${_scoreDetails.NAME_SCORING_DETAILS.ORG_NAME_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.GIVEN_NAME_SCORE) { _nameScoreValues.push(`giv:${_scoreDetails.NAME_SCORING_DETAILS.GIVEN_NAME_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.SURNAME_SCORE) { _nameScoreValues.push(`sur:${_scoreDetails.NAME_SCORING_DETAILS.SURNAME_SCORE}`); }
                        if (_scoreDetails.NAME_SCORING_DETAILS.GENERATION_MATCH_SCORE) { _nameScoreValues.push(`gen:${_scoreDetails.NAME_SCORING_DETAILS.GENERATION_MATCH_SCORE}`); }
                        _retStr += (_nameScoreValues.length > 0 ? ` (${_nameScoreValues.join('|')})` : '');
                    } else if (_scoreDetails && _scoreDetails.SCORE > -1) {
                        _retStr += ' (' + _scoreDetails.SCORE + ')';
                    }
                    _retStr += '</div>\n';
                }
            }
            return [_retStr, valueAdded];
        };
        let renderFeatureWithScoring = (data: (SzSdkWhyFeatureScore | SzSdkEntityFeatureWithScoring | SzSdkWhyCandidateKey)[], fieldName?: string, mk?: string): string => {
            let _result: string = undefined;
            if (data && data.length > 0 && data.forEach) {
                data = sortByScore(data);
                let valuesAlreadyAdded: string[] = [];
                data.forEach((_d) => {
                    let isEntityFeature = (_d as SzSdkEntityFeature) && (_d as SzSdkEntityFeature).FEAT_DESC_VALUES;
                    if (isEntityFeature) {
                        let _feat = (_d as SzSdkEntityFeature);
                        let _scoreDetails = (_d as SzSdkEntityFeatureWithScoring).scoringDetails ? (_d as SzSdkEntityFeatureWithScoring).scoringDetails : undefined;
                        let _allScoreDetails = (_d as SzSdkEntityFeatureWithScoring).featureScores ? (_d as SzSdkEntityFeatureWithScoring).featureScores : undefined;
                        let _detailValues = _feat.FEAT_DESC_VALUES || [];
                        if (_allScoreDetails && _allScoreDetails.forEach) {
                            let featureScores = sortByScore(_allScoreDetails);
                            featureScores.forEach((fs) => {
                                let _res = addFeatureToResult(fs, _scoreDetails, _detailValues, mk, fieldName, valuesAlreadyAdded);
                                if (_res[1]) valuesAlreadyAdded.push(_res[1] as string);
                                if (_res[0] && (!_result || _result === undefined)) _result = '';
                                if (_res[0]) _result += _res[0];
                            });
                        } else if (_detailValues && _detailValues.forEach) {
                            _detailValues.forEach((fd) => {
                                let _res = addFeatureToResult(fd, _scoreDetails, _detailValues, mk, fieldName, valuesAlreadyAdded);
                                if (_res[1]) valuesAlreadyAdded.push(_res[1] as string);
                                if (_res[0] && (!_result || _result === undefined)) _result = '';
                                if (_res[0]) _result += _res[0];
                            });
                        }
                    } else if ((_d as SzSdkWhyCandidateKey).FEAT_ID !== undefined) {
                        let f = (_d as SzSdkWhyCandidateKey);
                        let stats = fBId && fBId.has(f.FEAT_ID) ? fBId.get(f.FEAT_ID) : false;
                        if (!_result || _result === undefined) _result = '';
                        _result += '<div class="ws-nowrap line-text">' + f.FEAT_DESC;
                        if (stats && stats.statistics && stats.statistics.entityCount) {
                            _result += ` [${stats.statistics.entityCount}]`;
                        }
                        _result += '</div>\n';
                    }
                });
            }
            return _result;
        };
        _retVal = Object.assign(_retVal, {
            'NAME': renderFeatureWithScoring,
            'ADDRESS': renderFeatureWithScoring,
            'ENTITY_ID': (data) => {
                return data;
            },
            default: (data: (SzSdkWhyFeatureScore | SzSdkWhyCandidateKey | SzSdkEntityFeature | SzSdkWhyFocusRecord)[], fieldName?: string, mk?: string): string | string[] | SzWhyGrpcHTMLFragment => {
                let _result = '';
                if (data && data.length > 0 && data.forEach) {
                    let valuesAlreadyAdded: string[] = [];
                    data = data.sort((rowA, rowB) => {
                        let rowAAsScoring = (rowA as SzSdkEntityFeatureWithScoring);
                        let rowBAsScoring = (rowB as SzSdkEntityFeatureWithScoring);
                        if (rowAAsScoring.scoringDetails && rowBAsScoring.scoringDetails) {
                            return rowBAsScoring.scoringDetails.SCORE - rowAAsScoring.scoringDetails.SCORE;
                        }
                        return -1;
                    });
                    data.forEach((_d) => {
                        if ((_d as SzSdkEntityFeature).FEAT_DESC_VALUES) {
                            let _feat = (_d as SzSdkEntityFeature);
                            let _scoreDetails = (_d as SzSdkEntityFeatureWithScoring).scoringDetails;
                            let _allScoreDetails = (_d as SzSdkEntityFeatureWithScoring).featureScores;
                            let _detailValues = _feat.FEAT_DESC_VALUES || [];
                            if (_allScoreDetails && _allScoreDetails.forEach) {
                                let featureScores = sortByScore(_allScoreDetails);
                                featureScores.forEach((fs) => {
                                    let _res = addFeatureToResult(fs, _scoreDetails, _detailValues, mk, fieldName, valuesAlreadyAdded);
                                    if (_res[1]) valuesAlreadyAdded.push(_res[1] as string);
                                    if (_res[0]) _result += _res[0];
                                });
                            } else if (_detailValues && _detailValues.forEach) {
                                _detailValues.forEach((fd) => {
                                    let _res = addFeatureToResult(fd, _scoreDetails, _detailValues, mk, fieldName, valuesAlreadyAdded);
                                    if (_res[1]) valuesAlreadyAdded.push(_res[1] as string);
                                    if (_res[0]) _result += _res[0];
                                });
                            }
                        } else if ((_d as SzSdkWhyCandidateKey).FEAT_ID !== undefined) {
                            let f = (_d as SzSdkWhyCandidateKey);
                            let stats = fBId && fBId.has(f.FEAT_ID) ? fBId.get(f.FEAT_ID) : false;
                            _result += '<div class="ws-nowrap line-text">' + f.FEAT_DESC;
                            if (stats && stats.statistics && stats.statistics.entityCount) {
                                _result += ` [${stats.statistics.entityCount}]`;
                            }
                            _result += '</div>\n';
                        }
                    });
                } else {
                    if (data && data.toString) {
                        _result += `${data}`;
                    }
                }
                return _result;
            }
        });
        return _retVal;
    }

    protected override getData(): Observable<SzSdkWhyEntitiesResponse> {
        if (this.entityIds && this.entityIds.length === 2) {
            const flags = SzEngineFlags.SZ_WHY_ENTITIES_DEFAULT_FLAGS |
                SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_FEATURES |
                SzEngineFlags.SZ_ENTITY_INCLUDE_FEATURE_STATS |
                SzEngineFlags.SZ_INCLUDE_FEATURE_SCORES;
            return this.engineService.whyEntities(this.entityIds[0], this.entityIds[1], flags) as Observable<SzSdkWhyEntitiesResponse>;
        }
        return throwError(() => { return new Error("entity id's not specified"); });
    }

    override formatData(data: SzWhyGrpcEntityColumn[]): SzWhyGrpcEntityColumn[] {
        let retVal: SzWhyGrpcEntityColumn[];
        if (data) {
            retVal = data.map((columnData) => {
                let _retVal = Object.assign(columnData, {});
                if (_retVal.rows) {
                    let mk = columnData.whyResult ? columnData.whyResult.key : undefined;
                    for (let fKey in _retVal.rows) {
                        if (!_retVal.formattedRows) { _retVal.formattedRows = {}; }
                        _retVal.formattedRows[fKey] = this.renderers[fKey] ? this.renderers[fKey](_retVal.rows[fKey], fKey, mk) : this.renderers.default(_retVal.rows[fKey], fKey, mk);
                    }
                }
                return columnData;
            });
        }
        return retVal;
    }

    protected override onDataResponse(results: [SzSdkWhyEntitiesResponse, string[]]) {
        this._isLoading = false;
        this.loading.emit(false);
        this._data = results[0].WHY_RESULTS && results[0].WHY_RESULTS.length > 0 ? results[0].WHY_RESULTS[0] : undefined;
        this._entities = results[0].ENTITIES;
        this.onEntitiesChanged.emit(this._entities);
        if (results[1]) {
            this._orderedFeatureTypes = this._rows.map((fr) => fr.key).concat(results[1]);
        }
        this._featureStatsById = this.getFeatureStatsByIdFromEntityData(this._entities);
        this._featuresByDetailIds = this.getFeaturesByDetailIdFromEntityData(this._entities);
        this._shapedData = this.transformWhyNotResultData(this._data, this._entities);
        this._formattedData = this.formatData(this._shapedData);
        this._rows = this.getRowsFromData(this._shapedData, this._orderedFeatureTypes);
        this._headers = this.getHeadersFromData(this._shapedData);
        this.onResult.emit(this._data);
        this.onRowsChanged.emit(this._rows);
    }

    override transformWhyNotResultData(data: SzSdkWhyEntitiesResult, entities: SzSdkWhyEntityData[]): SzWhyGrpcEntityColumn[] {
        let results: SzWhyGrpcEntityColumn[] = [];
        if (entities && entities.length > 0) {
            results = entities.map((ent) => {
                let resolvedEnt = ent.RESOLVED_ENTITY;
                let retObj: SzWhyGrpcEntityColumn = {
                    entityId: resolvedEnt.ENTITY_ID,
                    features: resolvedEnt.FEATURES as any,
                    rows: {
                        'ENTITY_ID': [resolvedEnt.ENTITY_ID] as any,
                        'WHY_RESULT': data && data.MATCH_INFO && data.MATCH_INFO.MATCH_LEVEL_CODE !== 'NO_MATCH' ? {
                            key: data.MATCH_INFO.WHY_KEY,
                            rule: data.MATCH_INFO.ERRULE_CODE
                        } : undefined
                    }
                };
                if (data && data.MATCH_INFO) {
                    if (data.MATCH_INFO.WHY_KEY && data.MATCH_INFO.ERRULE_CODE) {
                        retObj.whyResult = { key: data.MATCH_INFO.WHY_KEY, rule: data.MATCH_INFO.ERRULE_CODE };
                    }
                }
                if (resolvedEnt.RECORDS) {
                    retObj.dataSources = resolvedEnt.RECORDS.map((r) => {
                        return r.DATA_SOURCE + ':' + r.RECORD_ID;
                    });
                    retObj.rows['DATA_SOURCES'] = resolvedEnt.RECORDS.map((r) => {
                        return { DATA_SOURCE: r.DATA_SOURCE, RECORD_ID: r.RECORD_ID } as SzSdkWhyFocusRecord;
                    });
                }
                return retObj;
            });
            // enrich features with scoring data from matchInfo
            results.forEach((ent) => {
                if (ent.features) {
                    for (let fKey in ent.features) {
                        if (data && data.MATCH_INFO && data.MATCH_INFO.FEATURE_SCORES && data.MATCH_INFO.FEATURE_SCORES[fKey]) {
                            let matchInfoForFeature = data.MATCH_INFO.FEATURE_SCORES[fKey];
                            let fArr = ent.features[fKey];
                            if (!ent.rows) { ent.rows = {}; }
                            if (!ent.rows[fKey]) { ent.rows[fKey] = []; }
                            ent.rows[fKey] = ent.rows[fKey].concat(fArr.map((entFeat) => {
                                let _retVal: SzSdkEntityFeatureWithScoring = Object.assign({}, entFeat);
                                let scoresThatHaveFeature = matchInfoForFeature.filter((fScore) => {
                                    if (entFeat.FEAT_DESC_VALUES) {
                                        let y = entFeat.FEAT_DESC_VALUES.find((fDetail) => {
                                            let hasCandidateFeature = fDetail.LIB_FEAT_ID === fScore.CANDIDATE_FEAT_ID;
                                            let hasInboundFeature = fDetail.LIB_FEAT_ID === fScore.INBOUND_FEAT_ID;
                                            return hasCandidateFeature || hasInboundFeature;
                                        });
                                        return !!y;
                                    }
                                    return false;
                                });
                                if (scoresThatHaveFeature && scoresThatHaveFeature.length > 0) {
                                    scoresThatHaveFeature = scoresThatHaveFeature.sort((a, b) => {
                                        return b.SCORE - a.SCORE;
                                    });
                                    _retVal.scoringDetails = scoresThatHaveFeature[0];
                                    _retVal.featureScores = scoresThatHaveFeature;
                                }
                                return _retVal;
                            }));
                        } else {
                            if (!ent.rows) { ent.rows = {}; }
                            if (!ent.rows[fKey]) { ent.rows[fKey] = []; }
                            ent.rows[fKey] = ent.features[fKey];
                        }
                    }
                }
            });
        }
        return results;
    }
}

@Component({
    selector: 'sz-dialog-why-entities-grpc',
    styleUrls: ['sz-why-entities-grpc-dialog.component.scss'],
    templateUrl: 'sz-why-entities-grpc-dialog.component.html',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        DragDropModule,
        SzWhyEntitiesGrpcComponent
    ]
})
export class SzWhyEntitiesGrpcDialog implements OnDestroy {
    public unsubscribe$ = new Subject<void>();

    private _entities: number[] = [];
    private _showOkButton = true;
    private _isLoading = true;
    private _isMaximized = false;
    private _title: string;
    public get isLoading(): boolean {
        return this._isLoading;
    }
    @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
    private set maximized(value: boolean) { this._isMaximized = value; }

    @ViewChild('whyEntitiesTag') whyEntitiesTag: SzWhyEntitiesGrpcComponent;

    public get title(): string {
        if (this._title) return this._title;
        this._title = `Why NOT for Entities (${this.entities.join(', ')})`;
        return this._title;
    }

    public okButtonText: string = 'Ok';
    public get showDialogActions(): boolean {
        return this._showOkButton;
    }

    public get entities(): number[] {
        return this._entities;
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: {
            entities: number[];
            okButtonText?: string;
            showOkButton?: boolean;
        },
        private cssClassesService: SzCSSClassService
    ) {
        if (data && data.entities) {
            this._entities = data.entities;
        }
        if (data && data.okButtonText) {
            this.okButtonText = data.okButtonText;
        }
        if (data && data.showOkButton !== undefined) {
            this._showOkButton = data.showOkButton;
        }
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public onDataLoading(isLoading: boolean) {
        this._isLoading = isLoading;
    }

    public onRowsChanged(data: SzWhyGrpcFeatureRow[]) {
        if (data && data.length > 8) {
            this.cssClassesService.setStyle(`body`, '--sz-why-dialog-default-height', `800px`);
        } else {
            this.cssClassesService.setStyle(`body`, '--sz-why-dialog-default-height', `var(--sz-why-dialog-default-height)`);
        }
    }

    public toggleMaximized() {
        if (!this.maximized) {
            this.maximized = true;
            this.cssClassesService.setStyle(`body`, '--sz-why-dialog-min-height', `98vh`);
        } else {
            this.maximized = false;
            this.cssClassesService.setStyle(`body`, '--sz-why-dialog-min-height', `400px`);
        }
    }

    public onDoubleClick(event: MouseEvent) {
        this.toggleMaximized();
    }

    public onEntitiesChanged(entities: SzSdkWhyEntityData[]) {
        if (entities && entities.length > 0 && entities.forEach) {
            let _title = `Why `;
            entities.forEach((entity: SzSdkWhyEntityData, _ind) => {
                let _bName = entity.RESOLVED_ENTITY.ENTITY_NAME;
                let _eId = entity.RESOLVED_ENTITY.ENTITY_ID;
                _title += `${_bName}(${_eId})` + (_ind === (entities.length - 1) ? '' : ' and ');
            });
            _title += ' did not resolve';
            this._title = _title;
        }
    }
}

import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, Inject } from '@angular/core';
import { Observable, Subject, takeUntil, zip, map } from 'rxjs';
import { getMapFromMatchKey, getArrayOfPairsFromMatchKey } from '../common/utils';
import { SzGrpcConfigManagerService } from '../services/grpc/configManager.service';
import { SzGrpcEngineService } from '../services/grpc/engine.service';
import { SzSdkEntityFeature } from '../models/grpc/engine';
import {
    SzSdkWhyFeatureScore,
    SzSdkWhyCandidateKey,
    SzSdkWhyFocusRecord,
    SzSdkWhyRecordInEntityResult,
    SzSdkWhyEntitiesResult,
    SzSdkWhyEntityData,
    SzSdkWhyRecordInEntityResponse,
    SzSdkWhyEntitiesResponse
} from '../models/grpc/why';
import {
    SzWhyGrpcFeatureRow,
    SzWhyGrpcEntityColumn,
    SzWhyGrpcHTMLFragment,
    SzSdkEntityFeatureWithScoring
} from '../models/data-why-grpc';

@Component({
    selector: 'sz-why-report-base-grpc',
    template: ''
})
export class SzWhyReportBaseGrpcComponent implements OnInit, OnDestroy {
    public unsubscribe$ = new Subject<void>();

    protected _data: SzSdkWhyRecordInEntityResult[] | SzSdkWhyEntitiesResult;
    protected _entities: SzSdkWhyEntityData[];
    protected _featureStatsById: Map<number, { LIB_FEAT_ID: number; FEAT_DESC: string; statistics?: any }>;
    protected _featuresByDetailIds: Map<number, SzSdkEntityFeature>;
    protected _formattedData: SzWhyGrpcEntityColumn[];
    protected _headers: string[];
    protected _isLoading = false;
    protected _orderedFeatureTypes: string[] | undefined;
    protected _rows: SzWhyGrpcFeatureRow[] = [
        { key: 'INTERNAL_ID', title: 'Internal ID' },
        { key: 'DATA_SOURCES', title: 'Data Sources' },
        { key: 'WHY_RESULT', title: 'Why Result' }
    ];
    protected _shapedData: SzWhyGrpcEntityColumn[];

    @Input() entityId: number;
    @Output() loading: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() onRowsChanged: EventEmitter<SzWhyGrpcFeatureRow[]> = new EventEmitter<SzWhyGrpcFeatureRow[]>();

    public get formattedData() {
        return this._formattedData;
    }
    public get headers() {
        return this._headers;
    }
    public get isLoading(): boolean {
        return this._isLoading;
    }
    public set isLoading(value: boolean) {
        this._isLoading = value;
    }
    public get rows() {
        return this._rows;
    }

    protected get renderers() {
        return this._renderers;
    }

    protected get _renderers() {
        let fBId = this._featureStatsById;
        let fBDId = this._featuresByDetailIds;
        let _colors = { 'CLOSE': 'green', 'SAME': 'green' };
        let featureIsInMatchKey = (f: string, mk: string): boolean => {
            let _r = false;
            if (mk) {
                _r = mk.indexOf(f) > -1;
            }
            return _r;
        };
        let sortByScore = (data: (SzSdkWhyFeatureScore | SzSdkEntityFeatureWithScoring | SzSdkWhyCandidateKey)[]) => {
            data = data.sort((rowA, rowB) => {
                let rowAScore = (rowA as SzSdkWhyFeatureScore).SCORE;
                let rowBScore = (rowB as SzSdkWhyFeatureScore).SCORE;
                if (rowAScore !== undefined && rowBScore !== undefined) {
                    return rowBScore - rowAScore;
                }
                return -1;
            });
            return data;
        };
        let mapHighestScoringFeaturesByInboundId = (featuresArray: (SzSdkWhyFeatureScore | SzSdkEntityFeatureWithScoring | SzSdkWhyCandidateKey)[]) => {
            let featuresByInboundId = new Map<number | string, SzSdkWhyFeatureScore | SzSdkEntityFeatureWithScoring | SzSdkWhyCandidateKey>();
            featuresArray.forEach((_feature) => {
                let isFeatureScore = (_feature as SzSdkWhyFeatureScore) && (_feature as SzSdkWhyFeatureScore).SCORE > -1;
                if (isFeatureScore && (_feature as SzSdkWhyFeatureScore).INBOUND_FEAT_ID) {
                    let f = (_feature as SzSdkWhyFeatureScore);
                    if (!featuresByInboundId.has(f.INBOUND_FEAT_ID)) {
                        featuresByInboundId.set(f.INBOUND_FEAT_ID, f);
                    }
                } else if ((_feature as SzSdkEntityFeature).LIB_FEAT_ID) {
                    let f = (_feature as SzSdkEntityFeature);
                    if (!featuresByInboundId.has(f.LIB_FEAT_ID)) {
                        featuresByInboundId.set(f.LIB_FEAT_ID, f);
                    }
                }
            });
            return featuresByInboundId;
        };
        return {
            'NAME': (data: (SzSdkWhyFeatureScore | SzSdkEntityFeatureWithScoring | SzSdkWhyCandidateKey)[], fieldName?: string, mk?: string) => {
                let retVal = '';
                let _filteredData = sortByScore(data);
                let entryIndex = -1;
                if (data && data.filter && data.some) {
                    // placeholder for future bucket filtering
                }
                let featuresByInboundId = mapHighestScoringFeaturesByInboundId(_filteredData);
                let displayedFeatures = Array.from(featuresByInboundId.values());
                displayedFeatures.forEach((_feature, i) => {
                    let le = (i < displayedFeatures.length - 1) ? '\n' : '';
                    entryIndex++;
                    let isFeatureScore = (_feature as SzSdkWhyFeatureScore) && (_feature as SzSdkWhyFeatureScore).SCORE > -1;

                    if (isFeatureScore && ((_feature as SzSdkWhyFeatureScore).INBOUND_FEAT_DESC || (_feature as SzSdkWhyFeatureScore).CANDIDATE_FEAT_DESC)) {
                        let f = (_feature as SzSdkWhyFeatureScore);
                        let c = entryIndex === 0 && _colors[f.SCORING_BUCKET] && featureIsInMatchKey('NAME', mk) ? 'color-' + _colors[f.SCORING_BUCKET] : '';
                        if (f.INBOUND_FEAT_DESC) {
                            let stats = fBId && fBId.has(f.INBOUND_FEAT_ID) ? fBId.get(f.INBOUND_FEAT_ID) : false;
                            retVal += `<div class="ws-nowrap line-text ${c}">` + f.INBOUND_FEAT_DESC;
                            if (stats && stats.statistics && stats.statistics.entityCount) {
                                retVal += ` [${stats.statistics.entityCount}]`;
                            }
                            retVal += le;
                            if (f.INBOUND_FEAT_ID !== f.CANDIDATE_FEAT_ID) {
                                retVal += '\n<div class="ws-nowrap"><span class="child-same"></span>';
                            }
                        }
                        if (f.CANDIDATE_FEAT_DESC && ((f.INBOUND_FEAT_DESC && f.INBOUND_FEAT_ID !== f.CANDIDATE_FEAT_ID) || !f.INBOUND_FEAT_DESC)) {
                            retVal += `${f.CANDIDATE_FEAT_DESC}${le}`;
                            if (f.NAME_SCORING_DETAILS) {
                                let _nameScoreValues = [];
                                if (f.NAME_SCORING_DETAILS.FULL_SCORE) { _nameScoreValues.push(`full:${f.NAME_SCORING_DETAILS.FULL_SCORE}`); }
                                if (f.NAME_SCORING_DETAILS.ORG_NAME_SCORE) { _nameScoreValues.push(`org:${f.NAME_SCORING_DETAILS.ORG_NAME_SCORE}`); }
                                if (f.NAME_SCORING_DETAILS.GIVEN_NAME_SCORE) { _nameScoreValues.push(`giv:${f.NAME_SCORING_DETAILS.GIVEN_NAME_SCORE}`); }
                                if (f.NAME_SCORING_DETAILS.SURNAME_SCORE) { _nameScoreValues.push(`sur:${f.NAME_SCORING_DETAILS.SURNAME_SCORE}`); }
                                if (f.NAME_SCORING_DETAILS.GENERATION_MATCH_SCORE) { _nameScoreValues.push(`gen:${f.NAME_SCORING_DETAILS.GENERATION_MATCH_SCORE}`); }
                                retVal += (_nameScoreValues.length > 0 ? `(${_nameScoreValues.join('|')})` : '');
                                if (f.INBOUND_FEAT_ID !== f.CANDIDATE_FEAT_ID) {
                                    retVal += '</div>' + le;
                                }
                                retVal += '</div>' + le;
                            }
                        } else if (f.INBOUND_FEAT_DESC) {
                            retVal += '</div>';
                        }
                    } else if ((_feature as SzSdkEntityFeature) && (_feature as SzSdkEntityFeature).FEAT_DESC) {
                        let f = (_feature as SzSdkEntityFeature);
                        retVal += f.FEAT_DESC;
                        let stats = fBId && fBId.has(f.LIB_FEAT_ID) ? fBId.get(f.LIB_FEAT_ID) : false;
                        if (stats && stats.statistics && stats.statistics.entityCount) {
                            retVal += ` [${stats.statistics.entityCount}]`;
                        }
                        retVal += le;
                    } else if ((_feature as SzSdkWhyCandidateKey).FEAT_ID !== undefined) {
                        let f = (_feature as SzSdkWhyCandidateKey);
                        let stats = fBId && fBId.has(f.FEAT_ID) ? fBId.get(f.FEAT_ID) : false;
                        retVal += f.FEAT_DESC;
                        if (stats && stats.statistics && stats.statistics.entityCount) {
                            retVal += ` [${stats.statistics.entityCount}]`;
                        }
                        retVal += le;
                    }
                });
                return retVal;
            },
            'ADDRESS': (data: (SzSdkWhyFeatureScore | SzSdkEntityFeatureWithScoring | SzSdkWhyCandidateKey)[], fieldName?: string, mk?: string) => {
                let retVal = '';
                let _filteredData = sortByScore(data);
                let entryIndex = -1;
                let featuresByInboundId = mapHighestScoringFeaturesByInboundId(_filteredData);
                let displayedFeatures = Array.from(featuresByInboundId.values());
                if (displayedFeatures && displayedFeatures.forEach) {
                    displayedFeatures.forEach((a, i) => {
                        entryIndex++;
                        let le = (i < displayedFeatures.length - 1) ? '\n' : '';
                        if ((a as SzSdkWhyFeatureScore).CANDIDATE_FEAT_DESC) {
                            let _a = (a as SzSdkWhyFeatureScore);
                            let c = entryIndex === 0 && _colors[_a.SCORING_BUCKET] && featureIsInMatchKey('ADDRESS', mk) ? 'color-' + _colors[_a.SCORING_BUCKET] : '';
                            retVal += '<div class="ws-nowrap">';
                            if (_a.INBOUND_FEAT_DESC) {
                                retVal += `<div class="line-text ${c}">${_a.INBOUND_FEAT_DESC}`;
                                let stats = fBId && fBId.has(_a.INBOUND_FEAT_ID) ? fBId.get(_a.INBOUND_FEAT_ID) : false;
                                if (stats && stats.statistics && stats.statistics.entityCount) {
                                    retVal += ` [${stats.statistics.entityCount}]`;
                                }
                                if (_a.INBOUND_FEAT_ID !== _a.CANDIDATE_FEAT_ID) {
                                    retVal += `</div>\n<div class="${c}"><span class="child-same"></span>`;
                                }
                            }
                            if (_a.CANDIDATE_FEAT_DESC && ((_a.INBOUND_FEAT_DESC && _a.INBOUND_FEAT_ID !== _a.CANDIDATE_FEAT_ID) || !_a.INBOUND_FEAT_DESC)) {
                                retVal += `${_a.CANDIDATE_FEAT_DESC}`;
                            }
                            if (_a.SCORE > -1) {
                                retVal += ` (${_a.SCORE})`;
                                if (_a.INBOUND_FEAT_DESC && _a.CANDIDATE_FEAT_DESC && _a.INBOUND_FEAT_ID !== _a.CANDIDATE_FEAT_ID) {
                                    retVal += '</div>' + le;
                                }
                            }
                            retVal += '</div>';
                        } else if ((a as SzSdkEntityFeature) && (a as SzSdkEntityFeature).FEAT_DESC) {
                            let f = (a as SzSdkEntityFeature);
                            retVal += '<div class="line-text ws-nowrap">' + f.FEAT_DESC;
                            let stats = fBId && fBId.has(f.LIB_FEAT_ID) ? fBId.get(f.LIB_FEAT_ID) : false;
                            if (stats && stats.statistics && stats.statistics.entityCount) {
                                retVal += ` [${stats.statistics.entityCount}]`;
                            }
                            retVal += '</div>' + le;
                        } else if ((a as SzSdkWhyCandidateKey).FEAT_ID !== undefined) {
                            let f = (a as SzSdkWhyCandidateKey);
                            let stats = fBId && fBId.has(f.FEAT_ID) ? fBId.get(f.FEAT_ID) : false;
                            retVal += '<div class="line-text ws-nowrap">' + f.FEAT_DESC;
                            if (stats && stats.statistics && stats.statistics.entityCount) {
                                retVal += ` [${stats.statistics.entityCount}]`;
                            }
                            retVal += '</div>' + le;
                        }
                    });
                }
                return retVal;
            },
            'DATA_SOURCES': (data: Array<SzSdkWhyFocusRecord>, fieldName?: string, mk?: string) => {
                let retVal = '';
                let _recordsBySource = new Map<string, SzSdkWhyFocusRecord[]>();
                data.forEach((r) => {
                    if (!_recordsBySource.has(r.DATA_SOURCE)) {
                        _recordsBySource.set(r.DATA_SOURCE, [r]);
                    } else {
                        let _vTA = _recordsBySource.get(r.DATA_SOURCE);
                        _recordsBySource.set(r.DATA_SOURCE, _vTA.concat([r]));
                    }
                });
                let alphaSorted = new Map([..._recordsBySource.entries()].sort((a, b) => {
                    if (a[0] < b[0]) return -1;
                    if (a[0] > b[0]) return 1;
                    return 0;
                }));
                retVal += `<div>`;
                for (let [key, value] of alphaSorted.entries()) {
                    retVal += `<span class="color-ds">${key}</span>: ${value.map((r) => { return r.RECORD_ID; }).join(', ')}\n`;
                }
                retVal += `</div>`;
                return retVal;
            },
            'WHY_RESULT': (data: { key: string; rule: string }, fieldName?: string, mk?: string) => {
                let _value = data && data.key ? data.key : '';
                if (data && data.key) {
                    let _values = getArrayOfPairsFromMatchKey(data.key);
                    _value = _values.map((t) => {
                        return `<span class="${t.prefix === '-' ? 'color-red' : 'color-green'}">${t.prefix + t.value}</span>`;
                    }).join('');
                    return `<div class="color-mk">${_value}</div>\n` + (data && data.rule ? `<div><span class="indented"></span>Principle: ${data.rule}</div>` : '');
                } else {
                    return `<span class="color-red">not found!</span>\n`;
                }
            },
            default: (data: (SzSdkWhyFeatureScore | SzSdkWhyCandidateKey | SzSdkEntityFeature | SzSdkWhyFocusRecord)[], fieldName?: string, mk?: string): string | string[] | SzWhyGrpcHTMLFragment => {
                let retVal = '';
                if (data && data.forEach) {
                    data.forEach((_feature, i) => {
                        let le = (i < data.length - 1) ? '\n' : '';
                        let isScoringFeature = (_feature as SzSdkWhyFeatureScore) && (_feature as SzSdkWhyFeatureScore).SCORE > -1;
                        if ((_feature as SzSdkEntityFeature).FEAT_DESC) {
                            let f = (_feature as SzSdkEntityFeature);
                            let stats = fBId && fBId.has(f.LIB_FEAT_ID) ? fBId.get(f.LIB_FEAT_ID) : false;
                            retVal += f.FEAT_DESC;
                            if (stats && stats.statistics && stats.statistics.entityCount) {
                                retVal += ` [${stats.statistics.entityCount}]`;
                            }
                            if (isScoringFeature) {
                                retVal += ` (${(_feature as SzSdkWhyFeatureScore).SCORE})`;
                            }
                            retVal += le;
                        } else if ((_feature as SzSdkWhyFeatureScore).CANDIDATE_FEAT_DESC) {
                            let f = (_feature as SzSdkWhyFeatureScore);
                            let c = _colors[f.SCORING_BUCKET] && featureIsInMatchKey(fieldName, mk) ? 'color-' + _colors[f.SCORING_BUCKET] : '';
                            let stats = fBId && fBId.has(f.CANDIDATE_FEAT_ID) ? fBId.get(f.CANDIDATE_FEAT_ID) : false;
                            retVal += '<div class="pre-text">';
                            retVal += `<span class="${c}">` + f.CANDIDATE_FEAT_DESC;
                            if (stats && stats.statistics && stats.statistics.entityCount) {
                                retVal += ` [${stats.statistics.entityCount}]`;
                            }
                            if (isScoringFeature) {
                                retVal += ` (${f.SCORE})`;
                            }
                            retVal += '</span></div>' + le;
                        } else if ((_feature as SzSdkWhyCandidateKey).FEAT_ID !== undefined) {
                            let f = (_feature as SzSdkWhyCandidateKey);
                            let stats = fBId && fBId.has(f.FEAT_ID) ? fBId.get(f.FEAT_ID) : false;
                            retVal += '<div class="pre-text">';
                            retVal += f.FEAT_DESC;
                            if (stats && stats.statistics && stats.statistics.entityCount) {
                                retVal += ` [${stats.statistics.entityCount}]`;
                            }
                            if (isScoringFeature) {
                                retVal += ` (${(_feature as SzSdkWhyFeatureScore).SCORE})`;
                            }
                            retVal += '</div>' + le;
                        } else if (_feature) {
                            retVal += new String(_feature);
                            retVal += le;
                        }
                    });
                }
                return retVal;
            }
        };
    }

    constructor(
        public configManagerService: SzGrpcConfigManagerService,
        protected engineService: SzGrpcEngineService) {
    }

    ngOnInit() {
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

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    protected getData(): Observable<any> {
        // overridden by subclasses
        return new Subject<any>().asObservable();
    }

    protected getOrderedFeatures(): Observable<string[]> {
        return this.configManagerService.features.pipe(
            map((fTypes) => fTypes.map((ft) => ft.FTYPE_CODE))
        );
    }

    public getRowValuesForData(rowKey: string, data?: SzWhyGrpcEntityColumn[]) {
        let retVal = [];
        data = data && data !== undefined ? data : this._formattedData;
        if (data && data.forEach) {
            data.forEach((dC) => {
                if (dC.formattedRows && dC.formattedRows[rowKey]) {
                    retVal.push(dC.formattedRows[rowKey]);
                } else {
                    retVal.push(undefined);
                }
            });
        }
        return retVal;
    }

    protected getHeadersFromData(data: SzWhyGrpcEntityColumn[]) {
        let cells = [];
        if (data && data.length) {
            cells = data.map((dC) => {
                return dC.internalId;
            });
        }
        return cells;
    }

    protected getRowsFromData(data: SzWhyGrpcEntityColumn[], orderedFeatureTypes?: string[]): SzWhyGrpcFeatureRow[] {
        let _rows = this._rows;
        data.forEach((res) => {
            let _featuresOfResult = res.rows;
            let _keysOfFeatures = Object.keys(_featuresOfResult);
            _keysOfFeatures.forEach((fKey) => {
                let rowAlreadyDefined = _rows.some((f) => {
                    return f.key === fKey;
                });
                if (!rowAlreadyDefined) {
                    _rows.push({ key: fKey, title: fKey });
                }
            });
        });
        if (orderedFeatureTypes && orderedFeatureTypes.length > 0) {
            _rows.sort((a: SzWhyGrpcFeatureRow, b: SzWhyGrpcFeatureRow) => {
                return orderedFeatureTypes.indexOf(a.key) - orderedFeatureTypes.indexOf(b.key);
            });
        }
        return _rows;
    }

    protected getFeaturesByDetailIdFromEntityData(entities: SzSdkWhyEntityData[]): Map<number, SzSdkEntityFeature> {
        let retVal: Map<number, SzSdkEntityFeature>;
        if (entities && entities.length > 0) {
            entities.forEach((entData) => {
                let _resolvedEnt = entData.RESOLVED_ENTITY;
                if (_resolvedEnt && _resolvedEnt.FEATURES) {
                    for (let _fName in _resolvedEnt.FEATURES) {
                        let _fTypeArray = _resolvedEnt.FEATURES[_fName];
                        if (_fTypeArray && _fTypeArray.forEach) {
                            _fTypeArray.forEach((_feat) => {
                                if (!retVal) {
                                    retVal = new Map<number, SzSdkEntityFeature>();
                                }
                                if (_feat && _feat.FEAT_DESC_VALUES && _feat.FEAT_DESC_VALUES.forEach) {
                                    _feat.FEAT_DESC_VALUES.forEach((_fdv) => {
                                        if (!retVal.has(_fdv.LIB_FEAT_ID)) {
                                            retVal.set(_fdv.LIB_FEAT_ID, _feat);
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            });
        }
        if (retVal && retVal.size > 0) {
            retVal = new Map([...retVal.entries()].sort((a, b) => {
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            }));
        }
        return retVal;
    }

    protected getFeatureStatsByIdFromEntityData(entities: SzSdkWhyEntityData[]): Map<number, any> {
        let retVal: Map<number, any>;
        if (entities && entities.length > 0) {
            entities.forEach((entData) => {
                let _resolvedEnt = entData.RESOLVED_ENTITY;
                if (_resolvedEnt && _resolvedEnt.FEATURES) {
                    for (let _fName in _resolvedEnt.FEATURES) {
                        let _fTypeArray = _resolvedEnt.FEATURES[_fName];
                        if (_fTypeArray && _fTypeArray.forEach) {
                            _fTypeArray.forEach((_feat) => {
                                if (!retVal) {
                                    retVal = new Map<number, any>();
                                }
                                if (_feat && _feat.FEAT_DESC_VALUES && _feat.FEAT_DESC_VALUES.forEach) {
                                    _feat.FEAT_DESC_VALUES.forEach((_fdv) => {
                                        if (!retVal.has(_fdv.LIB_FEAT_ID)) {
                                            retVal.set(_fdv.LIB_FEAT_ID, {
                                                LIB_FEAT_ID: _fdv.LIB_FEAT_ID,
                                                FEAT_DESC: _fdv.FEAT_DESC
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            });
        }
        if (retVal && retVal.size > 0) {
            retVal = new Map([...retVal.entries()].sort((a, b) => {
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            }));
        }
        return retVal;
    }

    protected formatData(data: SzWhyGrpcEntityColumn[]): SzWhyGrpcEntityColumn[] {
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

    protected onDataResponse(results: [any, string[]]) {
        this._isLoading = false;
        this.loading.emit(false);
    }

    protected transformWhyRecordData(data: SzSdkWhyRecordInEntityResult[], entities: SzSdkWhyEntityData[]): SzWhyGrpcEntityColumn[] {
        let results = data.map((matchWhyResult) => {
            let _tempRes: SzWhyGrpcEntityColumn = {
                internalId: matchWhyResult.INTERNAL_ID,
                entityId: matchWhyResult.ENTITY_ID,
                focusRecords: matchWhyResult.FOCUS_RECORDS,
                dataSources: matchWhyResult.FOCUS_RECORDS.map((record) => {
                    return record.DATA_SOURCE + ':' + record.RECORD_ID;
                }),
                whyResult: (matchWhyResult.MATCH_INFO.MATCH_LEVEL_CODE !== 'NO_MATCH') ? {
                    key: matchWhyResult.MATCH_INFO.WHY_KEY,
                    rule: matchWhyResult.MATCH_INFO.ERRULE_CODE
                } : undefined,
                rows: Object.assign({
                    'INTERNAL_ID': [matchWhyResult.INTERNAL_ID],
                    'DATA_SOURCES': matchWhyResult.FOCUS_RECORDS,
                    'WHY_RESULT': (matchWhyResult.MATCH_INFO.MATCH_LEVEL_CODE !== 'NO_MATCH') ? {
                        key: matchWhyResult.MATCH_INFO.WHY_KEY,
                        rule: matchWhyResult.MATCH_INFO.ERRULE_CODE
                    } : undefined
                }, matchWhyResult.MATCH_INFO.FEATURE_SCORES || {})
            };
            // sort rows by feature values
            for (let k in _tempRes.rows) {
                if (_tempRes && _tempRes.rows && _tempRes.rows[k] && _tempRes.rows[k].sort) {
                    _tempRes.rows[k] = _tempRes.rows[k].sort((a, b) => {
                        let aDesc = (a as SzSdkWhyFeatureScore).CANDIDATE_FEAT_DESC;
                        let bDesc = (b as SzSdkWhyFeatureScore).CANDIDATE_FEAT_DESC;
                        if (aDesc && bDesc) {
                            if (aDesc < bDesc) return -1;
                            if (aDesc > bDesc) return 1;
                        }
                        return 0;
                    });
                }
            }
            // add candidate keys
            if (matchWhyResult.MATCH_INFO && matchWhyResult.MATCH_INFO.CANDIDATE_KEYS) {
                for (let _k in matchWhyResult.MATCH_INFO.CANDIDATE_KEYS) {
                    if (!_tempRes.rows[_k]) {
                        _tempRes.rows[_k] = matchWhyResult.MATCH_INFO.CANDIDATE_KEYS[_k].sort((a, b) => {
                            if (a.FEAT_DESC < b.FEAT_DESC) return -1;
                            if (a.FEAT_DESC > b.FEAT_DESC) return 1;
                            return 0;
                        });
                    } else {
                        let _featuresOmittingExisting = matchWhyResult.MATCH_INFO.CANDIDATE_KEYS[_k].filter((_cFeat) => {
                            let alreadyHasFeat = _tempRes.rows[_k].some((_rowFeat) => {
                                return (_rowFeat as SzSdkWhyFeatureScore).CANDIDATE_FEAT_ID === _cFeat.FEAT_ID;
                            });
                            return !alreadyHasFeat;
                        }).sort((a, b) => {
                            if (a.FEAT_DESC < b.FEAT_DESC) return -1;
                            if (a.FEAT_DESC > b.FEAT_DESC) return 1;
                            return 0;
                        });
                        _tempRes.rows[_k] = _tempRes.rows[_k].concat(_featuresOmittingExisting);
                    }
                }
            }
            return _tempRes;
        });
        return results;
    }

    protected transformWhyNotResultData(data: SzSdkWhyEntitiesResult, entities: SzSdkWhyEntityData[]): SzWhyGrpcEntityColumn[] {
        let results: SzWhyGrpcEntityColumn[] = [];
        return results;
    }
}

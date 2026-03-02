import { Component, OnInit, Input, HostBinding, EventEmitter, Output } from '@angular/core';
import { CommonModule, KeyValuePipe, SlicePipe } from '@angular/common';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { SzSdkEntityFeature, SzSdkEntityFeatures, SzSdkHowResolutionStep, SzSdkVirtualEntityRecord } from '../../models/grpc/engine';
import { friendlyFeaturesName } from '../../models/data-features';
import {
    SzResolutionStepDisplayType,
    SzResolvedVirtualEntity,
    SzVirtualEntityRecordsClickEvent,
    SzVirtualEntityRecordsByDataSource
} from '../../models/data-how';
import { SzHowUIService } from '../../services/sz-how-ui.service';

/**
 * Display the "Virtual Entity" information for how resolution step
 *
 * @internal
*/
@Component({
    selector: 'sz-how-virtual-entity-card',
    templateUrl: './sz-how-virtual-entity-card.component.html',
    styleUrls: ['./sz-how-virtual-entity-card.component.scss'],
    imports: [
        CommonModule,
        MatExpansionModule,
        MatIconModule
    ]
})
export class SzHowVirtualEntityCardComponent implements OnInit {

    public stepsPanelOpenState = false;
    private _data: SzResolvedVirtualEntity;
    private _stepData: SzSdkHowResolutionStep;
    private _sources: SzVirtualEntityRecordsByDataSource;
    public _orderedFeatures: {name: string, features: SzSdkEntityFeature[]}[] | undefined;
    private _drawerStates: Map<string, boolean> = new Map([['SOURCES', false]]);

    @HostBinding('class.type-add') get cssTypeAddClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.ADD;
    }
    @HostBinding('class.type-merge') get cssTypeMergeClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.MERGE;
    }
    @HostBinding('class.type-interim') get cssTypeInterimClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.INTERIM;
    }
    @HostBinding('class.type-create') get cssTypeCreateClass(): boolean {
        return this.displayType === SzResolutionStepDisplayType.CREATE;
    }
    @HostBinding('class.sz-how-entity-card') cssCardClass: boolean = true;

    private _recordLimit: number = 5;
    @Input() featureOrder: string[];

    @Input() set step(value: SzSdkHowResolutionStep) {
        this._stepData = value;
    }
    @Input() set data(value: SzResolvedVirtualEntity) {
        this._data = value;
    }
    @Input() set virtualEntity(value: SzResolvedVirtualEntity) {
        this._data = value;
    }
    @Input() set recordLimit(value: number | string) {
        this._recordLimit = parseInt(value as string);
    }
    get id(): string {
        return this._data.virtualEntityId;
    }
    get recordLimit(): number {
        return this._recordLimit;
    }
    get data(): SzResolvedVirtualEntity | undefined {
        return this._data;
    }
    get orderedFeatures(): {name: string, features: SzSdkEntityFeature[]}[] | undefined {
        let retVal = this._orderedFeatures;
        if (!retVal && this._data) {
            retVal = this.getOrderedFeatures(this._data);
            if (retVal) {
                this._orderedFeatures = retVal;
                this._orderedFeatures.forEach((feat) => {
                    this._drawerStates.set(feat.name, true);
                });
            }
        }
        return retVal;
    }
    get virtualEntity(): SzResolvedVirtualEntity {
        return this._data;
    }

    public get title(): string {
        let retVal = 'Virtual Entity';
        if (this._data) {
            retVal = `Virtual Entity ${this.id}`;
        }
        return retVal;
    }
    get virtualEntityId(): string | undefined {
        if (this._data && this._data.virtualEntityId !== undefined) {
            return this._data.virtualEntityId;
        }
        return undefined;
    }
    get records(): SzSdkVirtualEntityRecord[] | undefined {
        if (this._data && this._data.RECORDS !== undefined) {
            return this._data.RECORDS;
        }
        return undefined;
    }
    get sources() {
        if (!this._sources && this._data && this._data.RECORDS) {
            let _recordsByDataSource: {
                [key: string]: Array<SzSdkVirtualEntityRecord>
            } = {};
            this._data.RECORDS.forEach((dsRec) => {
                if (!_recordsByDataSource[dsRec.DATA_SOURCE]) {
                    _recordsByDataSource[dsRec.DATA_SOURCE] = [];
                }
                _recordsByDataSource[dsRec.DATA_SOURCE].push(dsRec);
            });
            this._sources = _recordsByDataSource;
        }
        return this._sources;
    }

    get displayType(): SzResolutionStepDisplayType {
        return SzHowUIService.getResolutionStepCardType(this._stepData);
    }

    private _moreLinkClick: Subject<SzVirtualEntityRecordsClickEvent> = new Subject();
    public moreLinkClick = this._moreLinkClick.asObservable();
    @Output() public moreLinkClicked = new EventEmitter<SzVirtualEntityRecordsClickEvent>();

    public get matchInfo() {
        return this._stepData && this._stepData.MATCH_INFO ? this._stepData.MATCH_INFO : undefined;
    }
    public get featureScores() {
        return this._stepData && this._stepData.FEATURE_SCORES ? this._stepData.FEATURE_SCORES : undefined;
    }
    public get matchKey(): string {
        let retVal = [];
        if (this.matchInfo) {
            retVal = this.matchInfo.MATCH_KEY.split('+').filter((value) => value && value.trim && value.trim().length > 0);
        }
        return retVal.join(' + ');
    }
    public get matchCodes(): string {
        let retVal = '';
        if (this.featureScores && Object.keys(this.featureScores).length > 0) {
            let featureScoreCodes = [];
            let fScores = this.featureScores;
            for (let _fTypeKey in fScores) {
                let _fMatchArr = fScores[_fTypeKey];
                let _fMatchBehaviorCodes = _fMatchArr.map((_fMatchVal) => _fMatchVal.SCORE_BEHAVIOR);
                featureScoreCodes = featureScoreCodes.concat(_fMatchBehaviorCodes);
            }
            retVal = featureScoreCodes.join('+');
        }
        return retVal;
    }

    public getOrderedFeatures(entity: SzResolvedVirtualEntity): {name: string, features: SzSdkEntityFeature[]}[] | undefined {
        if (entity && entity.FEATURES) {
            let orderedFeatures = [];
            for (let _key in entity.FEATURES) {
                orderedFeatures.push({
                    name: _key,
                    features: entity.FEATURES[_key]
                });
            }
            // first sort alphabetically
            orderedFeatures.sort((a, b) => {
                var textA = a.name.toUpperCase();
                var textB = b.name.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });
            // order by "features from config" if available
            if (this.featureOrder && this.featureOrder.length > 0) {
                orderedFeatures.sort((a, b) => {
                    return this.featureOrder.indexOf(a.name) - this.featureOrder.indexOf(b.name);
                });
                return orderedFeatures;
            }
            return orderedFeatures;
        }
        return undefined;
    }

    public featureName(featureKey: string) {
        let retValue = featureKey;
        if (featureKey && friendlyFeaturesName.has(featureKey)) {
            retValue = friendlyFeaturesName.get(featureKey);
        } else if (featureKey && featureKey.indexOf('_') < 0) {
            let _words = featureKey.split(' ');
            let _capitalized = _words.map((_w) => {
                return _w[0].toUpperCase() + _w.substr(1).toLowerCase();
            }).join(' ').trim();
            retValue = _capitalized;
        }
        return retValue;
    }

    public toggleExpansion(drawerId: string) {
        let currentVal = this.isExpanded(drawerId);
        this._drawerStates.set(drawerId, !currentVal);
    }
    public isExpanded(drawerId: string): boolean {
        let retVal = true;
        if (this._drawerStates.has(drawerId)) {
            retVal = this._drawerStates.get(drawerId);
        }
        return retVal;
    }
    public onDrawerOpen(drawerId: string) {
        this._drawerStates.set(drawerId, true);
    }
    public onDrawerClose(drawerId: string) {
        this._drawerStates.set(drawerId, false);
    }
    public featureCount(featureCollection: SzVirtualEntityRecordsByDataSource | SzSdkEntityFeature[] | SzSdkVirtualEntityRecord[]) {
        if (featureCollection) {
            if (Object.keys(featureCollection)) {
                return Object.keys(featureCollection).length;
            } else if ((featureCollection as any[]).length) {
                return (featureCollection as any[]).length;
            }
        }
        return 0;
    }

    constructor(
        private howUIService: SzHowUIService
    ) {}

    ngOnInit() {}

    public onMoreLinkClick(dsKey: string, evt: MouseEvent) {
        let payload: SzVirtualEntityRecordsClickEvent = Object.assign(evt, {
            records: this.sources[dsKey],
            dataSourceName: dsKey
        });
        this._moreLinkClick.next(payload);
    }
}

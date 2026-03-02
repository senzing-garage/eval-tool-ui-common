import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, ElementRef, HostBinding, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SzResolutionStepListItemType, SzResolutionStepDisplayType, SzResolutionStepNode, SzResolvedVirtualEntity } from '../../models/data-how';
import { SzSdkHowFeatureScore, SzSdkHowResolutionStep, SzSdkSearchRecordSummary, SzSdkVirtualEntity, SzSdkVirtualEntityRecord } from '../../models/grpc/engine';
import { Subject } from 'rxjs';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzHowVirtualEntityDialog } from '../sz-how-virtual-entity-dialog.component';

/** @internal extends a feature score with the feature type key */
export interface SzHowFeatureScoreRow extends SzSdkHowFeatureScore {
    featureType: string;
}

/**
 * @internal
 *
 * This is the base class that provides common methods, inputs, outputs, getters, and setters
 * for step card components using gRPC models. This class is inherited by the basic step card
 * component and the final card component.
*/
@Component({
    selector: 'sz-how-step-card-base',
    template: `<p>Step Card Base</p>`,
    styleUrls: ['./sz-how-card-base.component.scss']
})
export class SzHowStepCardBase implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    protected unsubscribe$ = new Subject<void>();
    protected _data: SzResolutionStepNode;
    protected _siblings: Array<SzSdkHowResolutionStep | SzResolutionStepNode>;
    protected _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    protected _highlighted: boolean = false;
    protected _groupId: string;
    protected _groupIndex: number;
    protected _isInterimStep: boolean;
    protected _sourceAndRecordCount: {records: number, dataSources: number};

    protected prefs = inject(SzPrefsService, {optional: true});
    protected dialog = inject(MatDialog);

    // ----------------------------------- css classes -----------------------------------
    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isStepExpanded(this.id);
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isStepExpanded(this.id);
    }
    @HostBinding('class.highlighted') get cssHighlightedClass(): boolean {
        return this._highlighted ? true : false;
    }
    @HostBinding('class.type-add') get cssTypeAddClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.ADD;
    }
    @HostBinding('class.type-create') get cssTypeCreateClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.CREATE;
    }
    @HostBinding('class.type-final') get cssTypeClass(): boolean {
        return false;
    }
    @HostBinding('class.type-interim') get cssTypeInterimClass(): boolean {
        return this.isInterimStep;
    }
    @HostBinding('class.type-merge') get cssTypeMergeClass(): boolean {
        return this.stepType === SzResolutionStepDisplayType.MERGE && !this.isInterimStep;
    }
    @HostBinding('class.group-collapsed') get cssGroupCollapsedClass(): boolean {
        let _grpId = this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
        return _grpId ? !this.howUIService.isGroupExpanded(_grpId) : false;
    }
    @HostBinding('class.group-container') get cssGroupParentClass(): boolean {
        return this.isGroup;
    }
    @HostBinding('class.group-expanded') get cssGroupExpandedClass(): boolean {
        let _grpId = this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
        return _grpId ? this.howUIService.isGroupExpanded(_grpId) : false;
    }
    @HostBinding('class.group-member') get cssGroupMemberClass(): boolean {
        return this.isGroupMember;
    }
    @HostBinding('class.pinned') get cssGroupMemberPinnedClass(): boolean {
        return !this.isUnpinned;
    }
    @HostBinding('class.unpinned') get cssGroupMemberUnPinnedClass(): boolean {
        return this.isUnpinned;
    }
    @HostBinding('class.singleton') get cssSingletonClass(): boolean {
        return this.isSingleton;
    }
    @HostBinding('class.unresolved') get cssUnResolvedClass(): boolean {
        return false;
    }

    // ------------------------------ inputs and outputs -----------------------------
    @Input() set groupIndex(value: number) {
        this._groupIndex = value;
    }
    @Input() protected set isInterimStep(value: boolean) {
        this._isInterimStep = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
        }
        this._virtualEntitiesById = value;
    }
    @Input() set data(value: SzResolutionStepNode) {
        this._data = value;
    }
    @Input() set siblings(value: Array<SzSdkHowResolutionStep | SzResolutionStepNode>) {
        this._siblings = value;
    }
    @Input() set groupId(value: string) {
        this._groupId = value;
    }

    @Output()
    onExpand: EventEmitter<boolean> = new EventEmitter<boolean>();

    // ------------------------------ actions -----------------------------
    public toggleExpansion(vId?: string) {
        vId = vId ? vId : this.id;
        this.howUIService.toggleExpansion(vId, undefined, this.itemType);
    }
    public toggleGroupExpansion(gId?: string) {
        gId = gId ? gId : this.id;
        let itemType = this.isInterimStep ? SzResolutionStepListItemType.GROUP : this.isStackGroupMember ? SzResolutionStepListItemType.STACK : this.itemType;
        this.howUIService.toggleExpansion(undefined, gId, itemType);
    }
    public pinStep() {
        this.howUIService.pinStep(this.id, this._groupId);
    }
    public unPinStep() {
        this.howUIService.unPinStep(this.id);
    }
    public openVirtualEntityDialog(evt: any) {
        let targetEle = new ElementRef(evt.target);
        const dialogRef = this.dialog.open(SzHowVirtualEntityDialog, {
            panelClass: 'how-virtual-entity-dialog-panel',
            hasBackdrop: false,
            data: {
                target: targetEle,
                virtualEntity: this.resolvedVirtualEntity,
                stepData: this._data,
                featureOrder: this.howUIService.orderedFeatures,
                event: evt
            }
        });
    }

    // ------------------------------ getters and setters -----------------------------
    protected get id(): string {
        return this._data && this._data.id ? this._data.id : this._data && this._data.RESULT_VIRTUAL_ENTITY_ID ? this._data.RESULT_VIRTUAL_ENTITY_ID : undefined;
    }
    protected get itemType(): SzResolutionStepListItemType {
        return (this._data as SzResolutionStepNode).itemType ? (this._data as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP;
    }
    protected get isStack() {
        return (this._data as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STACK;
    }
    protected get isGroup() {
        return (this._data as SzResolutionStepNode).itemType === SzResolutionStepListItemType.GROUP;
    }
    protected get isStep() {
        return (this._data as SzResolutionStepNode).itemType === SzResolutionStepListItemType.STEP || (this._data as SzResolutionStepNode).itemType === undefined;
    }
    protected get isInterim() {
        return (this._data as SzResolutionStepNode).isInterim === true;
    }
    protected get isSingleton() {
        return this._data && SzHowUIService.isVirtualEntitySingleton(this._data) ? true : false;
    }
    protected get stepType(): SzResolutionStepDisplayType {
        if((this._data as SzResolutionStepNode).stepType){
            return (this._data as SzResolutionStepNode).stepType;
        }
        return this.getStepListItemCardType(this._data);
    }
    protected get hasChildren(): boolean {
        return (this._data as SzResolutionStepNode).children && (this._data as SzResolutionStepNode).children.length > 0;
    }
    protected get children(): Array<SzResolutionStepNode | SzSdkHowResolutionStep> {
        if(this.hasChildren) {
            return (this._data as SzResolutionStepNode).children;
        }
        return undefined;
    }
    get data() : SzResolutionStepNode {
        return this._data;
    }
    get groupId(): string {
        return this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
    }
    get isGroupMember(): boolean {
        return (this._data as SzResolutionStepNode).isMemberOfGroup;
    }
    get isStackGroupMember(): boolean {
        return this.howUIService.isStepMemberOfStack(this.id, this._groupId);
    }
    get isStackGroupMemberDebug(): boolean {
        return this.howUIService.isStepMemberOfStack(this.id, this._groupId, true);
    }
    get isUnpinned(): boolean {
        return !this.howUIService.isStepPinned(this.id, this._groupId);
    }
    get canBeGrouped(): boolean {
        if(this.isAddRecordStep && !this.isGroup) {
            return this.howUIService.stepCanBeUnPinned(this.id);
        }
        return false;
    }
    get canExpand(): boolean {
        return true;
    }
    public get isCollapsed() {
        return !this.howUIService.isStepExpanded(this.id);
    }
    protected get isGroupCollapsed() {
        return !this.howUIService.isGroupExpanded(this._groupId);
    }
    protected get isMergeStep() {
        return this.stepType === SzResolutionStepDisplayType.MERGE;
    }
    protected get isInterimStep() {
        return this.itemType === SzResolutionStepListItemType.GROUP && this.isInterim;
    }
    public get isCreateEntityStep() {
        return this.stepType === SzResolutionStepDisplayType.CREATE;
    }
    public get isFinalEntity() {
        return this.stepType === SzResolutionStepDisplayType.FINAL;
    }
    public get isAddRecordStep() {
        return this.stepType === SzResolutionStepDisplayType.ADD;
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }
    public get resolvedVirtualEntity(): SzResolvedVirtualEntity {
        let retVal;
        if(this._virtualEntitiesById && this._virtualEntitiesById.has(this.id)) {
            retVal = this._virtualEntitiesById.get(this.id);
            return retVal;
        }
        return retVal;
    }

    // ------------------------------ data getters -----------------------------
    public get title(): string {
        return '';
    }
    public get forms(): string {
        return (this._data && this._data.RESULT_VIRTUAL_ENTITY_ID) ? (this._data.RESULT_VIRTUAL_ENTITY_ID) : undefined;
    }
    public get matchKey(): string {
        if(this._data && this._data.MATCH_INFO && this._data.MATCH_INFO.MATCH_KEY) {
            return this._data.MATCH_INFO.MATCH_KEY;
        }
        return undefined;
    }
    public get resolutionRule(): string {
        if(this._data && this._data.MATCH_INFO && this._data.MATCH_INFO.ERRULE_CODE) {
            return this._data.MATCH_INFO.ERRULE_CODE;
        }
        return undefined;
    }
    public get showResolutionRule(): boolean {
        return this.prefs && this.prefs.how && this.prefs.how.showResolutionRule;
    }
    public get description(): string[] {
        let retVal = [];
        if(this._data) {
            let eType = this.isInterimStep && this.hasChildren ? 'Interim Entity' : 'Virtual Entity';
            retVal.push(`Forms <span class="emphasized">${eType} ${this._data.RESULT_VIRTUAL_ENTITY_ID}</span>`);
            if(this._data.MATCH_INFO && this._data.MATCH_INFO.MATCH_KEY) {
                retVal.push(`On <span class="emphasized">${this._data.MATCH_INFO.MATCH_KEY}</span>`);
            }
            if(this._data.MATCH_INFO && this._data.MATCH_INFO.ERRULE_CODE && this.showResolutionRule) {
                retVal.push(`Using <span class="emphasized">${this._data.MATCH_INFO.ERRULE_CODE}</span>`);
            }
        }
        return retVal;
    }
    public get groupTitle(): string {
        let retVal;
        if(this.hasChildren) {
            if(this.isInterimStep) {
                let _data = (this._data as SzResolutionStepNode);
                retVal = 'Interim Entity';
                if(_data) {
                    if(_data.id) {
                        retVal = _data.id +': '+ retVal;
                        if(this._virtualEntitiesById && this._virtualEntitiesById.has(_data.id)){
                            let _vEnt = this._virtualEntitiesById.get(_data.id);
                            retVal = _vEnt ? retVal +': ' : retVal;
                            retVal = retVal + _vEnt.ENTITY_NAME;
                        }
                    }
                }
            }
        } else if(this.isStackGroupMember) {
            if(this._groupIndex > 0){
                retVal = '';
            } else {
                retVal = 'Stack group member';
                if(this._siblings) {
                    let _retTypes = new Map<SzResolutionStepDisplayType, number>();
                    _retTypes.set(SzHowUIService.getResolutionStepCardType(this._data), 1);
                    this._siblings.forEach((step: SzSdkHowResolutionStep) => {
                        let _retType = SzHowUIService.getResolutionStepCardType(step);
                        if(_retTypes.has(_retType)){
                            _retTypes.set(_retType, (_retTypes.get(_retType) + 1));
                        } else {
                            _retTypes.set(_retType, 1);
                        }
                    });
                    if(_retTypes.size > 0) {
                        retVal = '';
                        _retTypes.forEach((typeCount, retType) => {
                            if(retType === SzResolutionStepDisplayType.ADD) {
                                retVal += `${typeCount} x Add Record to Virtual Entity\n\r`;
                            }
                        });
                    }
                }
            }
        }
        return retVal;
    }
    public get from(): string[] {
        let retVal = [];
        if(this._data && this._data.VIRTUAL_ENTITY_1 && this._data.VIRTUAL_ENTITY_1.MEMBER_RECORDS) {
            this._data.VIRTUAL_ENTITY_1.MEMBER_RECORDS.forEach((mr) => {
                if(mr.RECORDS) {
                    retVal = retVal.concat(mr.RECORDS.map((record) => {
                        return `${record.DATA_SOURCE}:${record.RECORD_ID}`;
                    }));
                }
            });
        }
        if(this._data && this._data.VIRTUAL_ENTITY_2 && this._data.VIRTUAL_ENTITY_2.MEMBER_RECORDS) {
            this._data.VIRTUAL_ENTITY_2.MEMBER_RECORDS.forEach((mr) => {
                if(mr.RECORDS) {
                    retVal = retVal.concat(mr.RECORDS.map((record) => {
                        return `${record.DATA_SOURCE}:${record.RECORD_ID}`;
                    }));
                }
            });
        }
        return retVal;
    }
    public get dataSources(): string[] {
        let retVal;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.RECORD_SUMMARY && _resolvedEntity.RECORD_SUMMARY.length > 0) {
            retVal = _resolvedEntity.RECORD_SUMMARY.map((rs: SzSdkSearchRecordSummary) => {
                return `${rs.DATA_SOURCE} (${rs.RECORD_COUNT})`;
            });
        }
        return retVal;
    }
    public get hasDataSources(): number {
        let retVal = 0;
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.RECORD_SUMMARY && _resolvedEntity.RECORD_SUMMARY.length > 0) {
            retVal = _resolvedEntity.RECORD_SUMMARY.length;
        }
        return retVal;
    }
    public get dataSourcesAsString(): string {
        let retVal = '';
        let _resolvedEntity = this.resolvedVirtualEntity;
        if(_resolvedEntity && _resolvedEntity.RECORD_SUMMARY && _resolvedEntity.RECORD_SUMMARY.length > 0) {
            let db_str = _resolvedEntity.RECORD_SUMMARY.map((rs: SzSdkSearchRecordSummary) => {
                return `${rs.DATA_SOURCE} (${rs.RECORD_COUNT})`;
            }).join(' | ');
            retVal += `${db_str}`;
        }
        return retVal;
    }

    // ------------------------------ virtual entity getters -----------------------------
    get candidateVirtualEntity(): SzSdkVirtualEntity | undefined {
        return (this._data && this._data.VIRTUAL_ENTITY_1) ? this._data.VIRTUAL_ENTITY_1 : undefined;
    }
    get inboundVirtualEntity(): SzSdkVirtualEntity | undefined {
        return (this._data && this._data.VIRTUAL_ENTITY_2) ? this._data.VIRTUAL_ENTITY_2 : undefined;
    }
    get column1VirtualEntity(): SzSdkVirtualEntity | undefined {
        let candidateOnLeft = this.candidateDataOnLeft;
        return candidateOnLeft ? this.candidateVirtualEntity : this.inboundVirtualEntity;
    }
    get column2VirtualEntity(): SzSdkVirtualEntity | undefined {
        let candidateOnLeft = this.candidateDataOnLeft;
        return candidateOnLeft ? this.inboundVirtualEntity : this.candidateVirtualEntity;
    }
    private get candidateDataOnLeft(): boolean {
        let candidateOnLeft = true;
        if(this._data && this._data.VIRTUAL_ENTITY_1 && this._data.VIRTUAL_ENTITY_2) {
            let candidateRecCount = this.getMemberRecordCount(this._data.VIRTUAL_ENTITY_1);
            let inboundRecCount = this.getMemberRecordCount(this._data.VIRTUAL_ENTITY_2);
            candidateOnLeft = candidateRecCount <= inboundRecCount;
        }
        return candidateOnLeft;
    }
    private getMemberRecordCount(virtualEntity: SzSdkVirtualEntity): number {
        if (!virtualEntity || !virtualEntity.MEMBER_RECORDS) return 0;
        return virtualEntity.MEMBER_RECORDS.reduce((count, mr) => count + (mr.RECORDS ? mr.RECORDS.length : 0), 0);
    }

    // ------------------------------ count methods -----------------------------
    public getSourceAndRecordCount(): {records: number, dataSources: number} {
        let retVal = { records: 0, dataSources: 0 };
        if(this._sourceAndRecordCount !== undefined) {
            return this._sourceAndRecordCount;
        }
        if(this._data){
            let _dataSources = new Set<string>();
            let _records = new Set<string>();
            const processVirtualEntity = (ve: SzSdkVirtualEntity) => {
                if(ve && ve.MEMBER_RECORDS) {
                    ve.MEMBER_RECORDS.forEach((mr) => {
                        if(mr.RECORDS) {
                            mr.RECORDS.forEach((_rec) => {
                                _dataSources.add(_rec.DATA_SOURCE);
                                _records.add(`${_rec.DATA_SOURCE}:${_rec.RECORD_ID}`);
                            });
                        }
                    });
                }
            };
            processVirtualEntity(this._data.VIRTUAL_ENTITY_1);
            processVirtualEntity(this._data.VIRTUAL_ENTITY_2);
            retVal.dataSources = _dataSources.size;
            retVal.records = _records.size;
        }
        this._sourceAndRecordCount = retVal;
        return this._sourceAndRecordCount;
    }
    public getSourcesAndRecordsForEntity(cellSource: SzSdkVirtualEntity) {
        let retVal = [];
        if(cellSource && cellSource.MEMBER_RECORDS) {
            let _dataSourceCounts = new Map<string, number>();
            let _allRecords: SzSdkVirtualEntityRecord[] = [];
            cellSource.MEMBER_RECORDS.forEach((mr) => {
                if(mr.RECORDS) {
                    mr.RECORDS.forEach((_rec) => {
                        _allRecords.push(_rec);
                        let _currentValue = _dataSourceCounts.has(_rec.DATA_SOURCE) ? _dataSourceCounts.get(_rec.DATA_SOURCE) : 0;
                        _dataSourceCounts.set(_rec.DATA_SOURCE, _currentValue + 1);
                    });
                }
            });
            for (let [key, value] of _dataSourceCounts) {
                let strVal = value === 1 ? `${key}:${_allRecords[0].RECORD_ID}` : `${key} (${value})`;
                retVal.push(strVal);
            }
        }
        return retVal.join(' | ');
    }
    public get sourcesCount(): number {
        return this.getSourceAndRecordCount().dataSources;
    }
    public get recordsCount(): number {
        return this.getSourceAndRecordCount().records;
    }

    // ------------------------------ feature score methods -----------------------------
    public get dataRows(): SzHowFeatureScoreRow[] {
        let retVal: SzHowFeatureScoreRow[] = [];
        if(this._data && this._data.FEATURE_SCORES) {
            let _tempMap = new Map<string, SzHowFeatureScoreRow>();
            for(let fkey in this._data.FEATURE_SCORES) {
                this._data.FEATURE_SCORES[fkey].forEach((featScore: SzSdkHowFeatureScore) => {
                    let row: SzHowFeatureScoreRow = Object.assign({featureType: fkey}, featScore);
                    if(_tempMap.has(fkey)) {
                        if(_tempMap.get(fkey).SCORE < row.SCORE) {
                            _tempMap.set(fkey, row);
                        }
                    } else {
                        _tempMap.set(fkey, row);
                    }
                });
            }
            retVal = [..._tempMap.values()];
            if(this.howUIService.orderedFeatures && this.howUIService.orderedFeatures.length > 0) {
                retVal.sort((a: SzHowFeatureScoreRow, b: SzHowFeatureScoreRow) => {
                    return this.howUIService.orderedFeatures.indexOf(a.featureType) - this.howUIService.orderedFeatures.indexOf(b.featureType);
                });
            }
        }
        return retVal;
    }
    public getDataRowColumn1Score(feature: SzHowFeatureScoreRow): {featureValue: string} {
        let candidateDataOnLeft = this.candidateDataOnLeft;
        return {featureValue: candidateDataOnLeft ? feature.CANDIDATE_FEAT_DESC : feature.INBOUND_FEAT_DESC};
    }
    public getDataRowColumn2Score(feature: SzHowFeatureScoreRow): {featureValue: string} {
        let candidateDataOnLeft = this.candidateDataOnLeft;
        return {featureValue: candidateDataOnLeft ? feature.INBOUND_FEAT_DESC : feature.CANDIDATE_FEAT_DESC};
    }
    public getMatchKeyAsObjects(matchKey?: string): Map<string, boolean> {
        let retVal: Map<string, any> = new Map();
        if(!matchKey) {
            matchKey = (this._data && this._data.MATCH_INFO && this._data.MATCH_INFO.MATCH_KEY) ? this._data.MATCH_INFO.MATCH_KEY : matchKey;
            if(!matchKey) { return retVal; }
        }
        if(matchKey && matchKey.split) {
            matchKey.split('+').filter((v) => { return v && v.trim ? v.trim() !== '' : false}).map((token: string)=>{
                if(token.indexOf('-') > -1) {
                    let _posTokenStr = token.substring(0,token.indexOf('-'));
                    let _negTokenStr = token.substring(token.indexOf('-'));
                    let _negTokens = _negTokenStr.split('-').filter((v) => { return v && v.trim ? v.trim() !== '' : false});
                    retVal.set(_posTokenStr, true);
                    _negTokens.forEach((tokenStr: string) => {
                        retVal.set(tokenStr, false);
                    });
                    retVal.set(_posTokenStr, true);
                } else {
                    retVal.set(token, true);
                }
            })
        }
        return retVal;
    }
    protected isMatchKeyForFeaturePositive(feature: SzHowFeatureScoreRow): boolean | undefined {
        let matchKeysAsObjects = this.getMatchKeyAsObjects();
        if(matchKeysAsObjects && matchKeysAsObjects.has && matchKeysAsObjects.has(feature.featureType)) {
            return matchKeysAsObjects.get(feature.featureType);
        }
        return undefined;
    }
    public isCellHighlightedRed(feature: SzHowFeatureScoreRow, featureValue: any): boolean {
        let matchKeyIsPositive = this.isMatchKeyForFeaturePositive(feature);
        if(matchKeyIsPositive !== undefined && matchKeyIsPositive === false) {
            return true;
        }
        return false;
    }
    public isCellHighlightedYellow(feature: SzHowFeatureScoreRow, featureValue: any): boolean {
        let matchKeyIsPositive = this.isMatchKeyForFeaturePositive(feature);
        if(
            (feature.SCORE_BUCKET !== 'CLOSE' && feature.SCORE_BUCKET !== 'SAME') &&
            (
                matchKeyIsPositive === undefined ||
                (matchKeyIsPositive !== undefined && matchKeyIsPositive !== false)
            )
        ) {
            return true;
        }
        return false;
    }
    public isCellHighlightedGreen(feature: SzHowFeatureScoreRow, featureValue: any): boolean {
        let matchKeyIsPositive = this.isMatchKeyForFeaturePositive(feature);
        if(
            matchKeyIsPositive === true ||
            feature.SCORE_BUCKET === 'SAME' ||
            feature.SCORE_BUCKET === 'CLOSE'
        ) {
            return true;
        }
        return false;
    }

    // ------------------------------ utility methods -----------------------------
    protected getStepListItemCardType(step: SzSdkHowResolutionStep): SzResolutionStepDisplayType {
        return this._isInterimStep ? SzResolutionStepDisplayType.INTERIM : SzHowUIService.getResolutionStepCardType(step);
    }

    constructor(
        protected howUIService: SzHowUIService
    ){}

    ngOnInit() {}

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}

import { Component, OnInit, Input, OnDestroy, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/collections';
import { 
    //EntityDataService as SzEntityDataService, 
    //SzResolutionStep, SzVirtualEntityRecord, 
    //SzFeatureScore 
} from '@senzing/rest-api-client-ng';
import { SzResolutionStepDisplayType, SzResolvedVirtualEntity } from '../models/data-how';
import { parseBool } from '../common/utils';
import { filter, Subject, takeUntil } from 'rxjs';
import { isNotNull } from '../common/utils';
import { SzHowUIService } from '../services/sz-how-ui.service';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { SzSdkHowFeatureScore, SzSdkHowResolutionStep, SzSdkVirtualEntity, SzSdkVirtualEntityRecord } from '../models/grpc/engine';

/**
 * @internal 
 * model for counting how many steps match a specific parameter */
export interface SzHowNavComponentParameterCounts {
    'CREATE': number,
    'ADD': number,
    'MERGE': number,
    'LOW_SCORE_NAME': number,
    'LOW_SCORE_ADDRESS': number,
    'LOW_SCORE_PHONE': number
}
/** 
 * @internal
 * model that extends a resolution step with display specific metadata used in the matches list */
export interface SzResolutionStepListItem extends SzSdkHowResolutionStep {
    actionType: SzResolutionStepDisplayType,
    title: string,
    cssClasses?: string[],
    description: {text: string, cssClasses: string[]}[],
    recordIds?: string[],
    dataSources?: string[],
    freeTextTerms?: string[],
    fullTextTerms?: string[],
}
/**
 * @internal
 * Provides a collapsible list of steps from a "How" report that can 
 * be used for quickly navigating a how report and filtering based on user 
 * parameters.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-how-nav></sz-how-nav>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-wc-how-nav></sz-wc-how-nav>
*/
@Component({
    selector: 'sz-how-nav',
    templateUrl: './sz-how-nav.component.html',
    styleUrls: ['./sz-how-nav.component.scss'],
    imports: [
        CommonModule, FormsModule,
        MatCheckboxModule, MatInputModule
    ]
})
export class SzHowNavComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    /** 
     * @internal
     * object of steps to navigate keyed by virtualId
     */
    private _stepMap: {[key: string]: SzSdkHowResolutionStep} = {};
    /** 
     * @internal
     * map of virtual entities keyed by virtualId
     */
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    /** 
     * @internal 
     * when the list of steps is prepared for render it is extended with 
     * metadata and cached in this variable*/
    private _listSteps: SzResolutionStepListItem[];
    /** @internal when the full list of virtual entities is passed in or changed this subject emits */
    private _virtualEntitiesDataChange: Subject<Map<string, SzResolvedVirtualEntity>> = new Subject<Map<string, SzResolvedVirtualEntity>>();
    /** when the full list of virtual entities is passed in or changed this subject emits */
    public  virtualEntitiesDataChange   = this._virtualEntitiesDataChange.asObservable();
    /** whether or not to add the collapsed css class to the component */
    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isNavExpanded;
    }
    /** whether or not to add the expanded css class to the component */
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isNavExpanded;
    }
    /** when a feature's score falls below this value it is counted as "low scoring" */
    @Input() public lowScoringFeatureThreshold: number = 85;
    /** map of virtual entities keyed by virtualId */
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        this._virtualEntitiesById = value;
        this._virtualEntitiesDataChange.next(this._virtualEntitiesById);
        this._parameterCounts = this.getParameterCounts();
    }
    /** an object of steps whos key value is the virtual id of the step */
    @Input() set stepsByVirtualId(value: {[key: string]: SzSdkHowResolutionStep}) {
        this._stepMap = value;
        this._parameterCounts = this.getParameterCounts();
    }
    /** an object of steps whos key value is the virtual id of the step */
    get stepsByVirtualId(): {[key: string]: SzSdkHowResolutionStep} {
        return this._stepMap;
    }
    /** returns an array of steps regardless of step type  */
    get allSteps(): SzSdkHowResolutionStep[] {
        let retVal = [];
        if(this._stepMap) {
            let _steps = (Object.values(this._stepMap));
            _steps[0].RESULT_VIRTUAL_ENTITY_ID
            retVal = _steps;
        }
        return retVal;
    }
    /** gets the total number of steps */
    get numberOfTotalSteps(): number {
        let retVal = 0;
        if(this._stepMap && Object.keys(this._stepMap)) {
            retVal = Object.keys(this._stepMap).length;
        }
        return retVal;
    }
    /** gets the total number of steps where two virtual entitities where merged together */
    get numberOfMergeSteps(): number {
        let retVal = 0;
        if(this.mergeSteps) {
            retVal = this.mergeSteps.length;
        }
        return retVal;
    }
    /** gets the total number of steps where an individual record was added to an existing virtual entity */
    get numberOfAddRecordSteps(): number {
        let retVal = 0;
        if(this.addRecordSteps) {
            retVal = this.addRecordSteps.length;
        }
        return retVal;
    }
    /** gets the total number of steps where two records created a new virtual entity */
    get numberOfCreateVirtualEntitySteps(): number {
        let retVal = 0;
        if(this.createEntitySteps) {
            retVal = this.createEntitySteps.length;
        }
        return retVal;
    }
    /** returns a array of resolution steps that merge virtual entities together */
    get mergeSteps(): SzSdkHowResolutionStep[] {
        let retVal = undefined;
        if(this._stepMap && Object.keys(this._stepMap) && Object.keys(this._stepMap).length > 0) {
            // we have steps, do we have merge steps
            let stepsThatAreMerges = [];
            let steps = Object.values(this._stepMap);
            let _tVal = steps.filter((step: SzSdkHowResolutionStep) => {
                // check if merge step
                return SzHowUIService.isVirtualEntityMergeStep(step);
            });
        }
        return retVal;
    }
    /** returns a array of resolution steps that add a record to a previously created virtual entity */
    get addRecordSteps(): SzSdkHowResolutionStep[] {
        let retVal = undefined;
        if(this._stepMap && Object.keys(this._stepMap) && Object.keys(this._stepMap).length > 0) {
            // we have steps, do we have merge steps
            let stepsThatAreMerges = [];
            let steps = Object.values(this._stepMap);
            let _tVal = steps.filter((step: SzSdkHowResolutionStep) => {
                // check if merge step
                return SzHowUIService.isAddRecordStep(step);
            });
            if(_tVal) {
                retVal = _tVal;
            }
        }
        return retVal;
    }
    /** returns a array of resolution steps where both the inbound AND candidate entities are singletons */
    get createEntitySteps(): SzSdkHowResolutionStep[] {
        let retVal = undefined;
        if(this._stepMap && Object.keys(this._stepMap) && Object.keys(this._stepMap).length > 0) {
            // we have steps, do we have merge steps
            let stepsThatAreMerges = [];
            let steps = Object.values(this._stepMap);
            let _tVal = steps.filter((step: SzSdkHowResolutionStep) => {
                // check if merge step
                return SzHowUIService.isCreateEntityStep(step);
            });
            retVal = _tVal;
        }
        return retVal;
    }

    /** sets whether or not the "collapsed" css class is applied to component */
    toggleExpanded() {
        this.howUIService.isNavExpanded = !this.howUIService.isNavExpanded;
    }

    // ---------------------------------------- start parameters
    /** @internal */
    private _filterByTextOrRecordId: string             = undefined;
    /** @internal */
    private _filterByVirtualEntityCreation: boolean     = false;
    /** @internal */
    private _filterByMergeInterimEntitites: boolean     = false;
    /** @internal */
    private _filterByAddRecordtoVirtualEntity: boolean  = false;
    /** @internal */
    private _filterByLowScoringNames: boolean           = false;
    /** @internal */
    private _filterByLowScoringAddresses                = false;
    /** @internal */
    private _filterByLowScoringPhoneNumbers: boolean    = false;
        // ---------------------------------------- public getters
        /** get the text or record id being searched for */
        get filterByTextOrRecordId(): string | undefined   { return this._filterByTextOrRecordId; }
        /** whether or not to include steps that created a new virtual entity  */
        get filterByVirtualEntityCreation(): boolean       { return this._filterByVirtualEntityCreation; }
        /** whether or not to include steps that merged one or more virtual entities */
        get filterByMergeInterimEntitites(): boolean       { return this._filterByMergeInterimEntitites; }
        /** whether or not to include steps where a record was added to a virtual entity */
        get filterByAddRecordtoVirtualEntity(): boolean    { return this._filterByAddRecordtoVirtualEntity; }
        /** whether or not to include steps where names where not a close or same match */
        get filterByLowScoringNames(): boolean             { return this._filterByLowScoringNames; }
        /** whether or not to include steps where addresses were not a close or same match */
        get filterByLowScoringAddresses(): boolean         { return this._filterByLowScoringAddresses; }
        /** whether or not to include steps where phone numbers were not a close or same match */
        get filterByLowScoringPhoneNumbers(): boolean      { return this._filterByLowScoringPhoneNumbers; }

        // ---------------------------------------- public setters
        /** get the text or record id being searched for */
        @Input() set filterByTextOrRecordId(value: string | undefined) {
            this._filterByTextOrRecordId = value;
        }
        /** whether or not to include steps that created a new virtual entity  */
        @Input() set filterByVirtualEntityCreation(value: boolean | undefined) {
            this._filterByVirtualEntityCreation = parseBool(value);
        }
        /** whether or not to include steps that merged one or more virtual entities */
        @Input() set filterByMergeInterimEntitites(value: boolean | undefined) {
            this._filterByMergeInterimEntitites = parseBool(value);
        }
        /** whether or not to include steps where a record was added to a virtual entity */
        @Input() set filterByAddRecordtoVirtualEntity(value: boolean | undefined) {
            this._filterByAddRecordtoVirtualEntity = parseBool(value);
        }
        /** whether or not to include steps where names were not a close or same match */
        @Input() set filterByLowScoringNames(value: boolean | undefined) {
            this._filterByLowScoringNames = parseBool(value);
        }
        /** whether or not to include steps where addresses were not a close or same match */
        @Input() set filterByLowScoringAddresses(value: boolean | undefined) {
            this._filterByLowScoringAddresses = parseBool(value);
        }
        /** whether or not to include steps where phone numbers were not a close or same match */
        @Input() set filterByLowScoringPhoneNumbers(value: boolean | undefined) {
            this._filterByLowScoringPhoneNumbers = parseBool(value);
        }
    // ---------------------------------------- end parameters

    // ---------------------------------------- start filtered collection getters
    
    /** list for steps extended with presentation and filtering specific data */
    public get listSteps(): SzResolutionStepListItem[] {
        let retVal: SzResolutionStepListItem[] = [];
        if(!this._listSteps) {
            this._listSteps = this.getListSteps();
        }
        if(this._listSteps){
            retVal = this._listSteps;
        }
        return retVal;
    }
    /** 
     * @internal
     * generates extended presentation and filtering specific data for steps and returns them as an array of extended items */
    private getListSteps(): SzResolutionStepListItem[] {
        let retVal: SzResolutionStepListItem[];
        if(this._stepMap) {
            let _steps = (Object.values(this._stepMap));
            retVal = _steps.map((_s: SzSdkHowResolutionStep) => {
                let _t: SzResolutionStepListItem = Object.assign({
                    actionType: this.getStepListCardType(_s),
                    cssClasses: this.getStepListItemCssClasses(_s), 
                    title: this.getStepListItemTitle(_s),
                    description: this.getStepListItemDescription(_s),
                    recordIds: this.getStepListItemRecords(_s),
                    dataSources: this.getStepListItemDataSources(_s)
                }, _s);
                _t.freeTextTerms    = this.getStepListItemFreeTextTerms(_t);
                return _t;
            });
        }
        return retVal;
    }
    /** the list of steps filtered by user selected parameters */
    public get filteredListSteps(): SzResolutionStepListItem[] {
        let oVal    = this.listSteps;
        let retVal  = oVal.filter((step: SzResolutionStepListItem) => {
            let _hasParamsChecked   = false;
            let _inc                = false;

            if(this._filterByVirtualEntityCreation) {
                _hasParamsChecked = true;
                _inc = _inc || step.actionType == SzResolutionStepDisplayType.CREATE;
            }
            if(this._filterByAddRecordtoVirtualEntity) {
                _hasParamsChecked = true;
                _inc = _inc || step.actionType == SzResolutionStepDisplayType.ADD;
            }
            if(this._filterByMergeInterimEntitites) {
                _hasParamsChecked = true;
                _inc = _inc || step.actionType == SzResolutionStepDisplayType.MERGE;
            }
            // now check for low-scoring features
            if(this._filterByLowScoringNames || this.filterByLowScoringAddresses || this.filterByLowScoringPhoneNumbers) {
                _hasParamsChecked = true;
                let hasLowScoringFeature = false;
                if(this._filterByLowScoringNames && step.FEATURE_SCORES && step.FEATURE_SCORES['NAME']){
                    // has name features
                    let nameScores = SzHowUIService.getFeatureScoreByType('NAME', step);
                    // we only assign if value is false,
                    // that way the default is false UNLESS the condition is true
                    if(!hasLowScoringFeature) {
                        hasLowScoringFeature = nameScores.some((featScore: SzSdkHowFeatureScore) => {
                            return !(featScore.SCORE > this.lowScoringFeatureThreshold);
                        });
                        if(hasLowScoringFeature) {
                            //console.log('HAS LOW SCORING NAME!!', step);
                        }
                    }
                }
                if(this.filterByLowScoringAddresses && step.FEATURE_SCORES && step.FEATURE_SCORES['ADDRESS']){
                    // has name features
                    let nameScores = SzHowUIService.getFeatureScoreByType('ADDRESS', step);
                    // we only assign if value is false,
                    // that way the default is false UNLESS the condition is true
                    if(!hasLowScoringFeature) {
                        hasLowScoringFeature = nameScores.some((featScore: SzSdkHowFeatureScore) => {
                            return !(featScore.SCORE > this.lowScoringFeatureThreshold);
                        });
                        if(hasLowScoringFeature) {
                            //console.log('HAS LOW SCORING ADDRESS!!', step);
                        }
                    }
                }
                if(this.filterByLowScoringPhoneNumbers && step.FEATURE_SCORES && step.FEATURE_SCORES['PHONE']) {
                    // has phone features
                    let phoneScores = SzHowUIService.getFeatureScoreByType('PHONE', step);
                    // we only assign if value is false,
                    // that way the default is false UNLESS the condition is true
                    if(!hasLowScoringFeature) {
                        hasLowScoringFeature = phoneScores.some((featScore: SzSdkHowFeatureScore) => {
                            return !(featScore.SCORE > this.lowScoringFeatureThreshold);
                        });
                        if(hasLowScoringFeature) {
                            //console.log('HAS LOW SCORING PHONE!!', step);
                        }
                    }
                }
                if(hasLowScoringFeature) {
                    _inc = true;
                }
            }

            // if no parameters are selected just return everything
            return _hasParamsChecked ? _inc : true;
        });

        // we do the free text search OUTSIDE of main criteria check loop so that 
        // the checkbox parameters are an "OR" operation by themselves, but become 
        // a "AND" operation in conjunction with free text search
        if(this._filterByTextOrRecordId && isNotNull(this._filterByTextOrRecordId)){
            // check if text is in record Id's
            let _critStr            = this._filterByTextOrRecordId.toUpperCase().trim();
            
            let _critTerms          = _critStr.split(' ');
            let _critTerm           = _critStr;

            retVal  = retVal.filter((step: SzResolutionStepListItem) => {
                // record id's specifically
                let _hasMatchingRecords = step.recordIds.some((recordId: string) => {
                    return recordId.toUpperCase().trim().startsWith(_critStr);
                });
                // for matching individual words like compound terms like "Jenny Smith"
                // or "Create V2000-4"
                // result must match ALL words in search
                let _hasMatchingTerms   = _critTerms.every(sTermTag => {
                    return step.freeTextTerms.some((termTag) => {
                        return termTag.toUpperCase().startsWith(sTermTag.toUpperCase());
                    })
                });
                // for matching things like multi-word address, full name etc
                let _hasMatchingTerm    = step.freeTextTerms.some((termTag) => {
                    return termTag.toUpperCase().indexOf(' '+_critTerm.toUpperCase()) > -1 || termTag.toUpperCase().startsWith(_critTerm.toUpperCase());
                    //return termTag.toUpperCase().indexOf(_critTerm.toUpperCase()) > -1; // changed to match full search term at any position in keyterms
                    //return termTag.toUpperCase().startsWith(_critTerm.toUpperCase()); // has to match search term from the beginning of keyterm
                });
                return _hasMatchingRecords || _hasMatchingTerms || _hasMatchingTerm ? true : false;
            });
        }
        return retVal;
    }

    /**
     * @internal 
     * map of counts for specific filtering criteria to show user how many items will be 
     * selected when a filter is applied
     */
    private _parameterCounts: SzHowNavComponentParameterCounts = {
        'CREATE': 0,
        'ADD': 0,
        'MERGE': 0,
        'LOW_SCORE_NAME':0,
        'LOW_SCORE_ADDRESS':0,
        'LOW_SCORE_PHONE':0
    }
    /** map of counts for specific filtering criteria to show user how many items will be 
     * selected when a filter is applied
     */
    public get parameterCounts(): SzHowNavComponentParameterCounts {
        return this._parameterCounts;
    }
    /** gets the number of steps for a particular filter from the pre-generated parameterCounts map */
    public getParameterCount(name: string): number {
        let retVal = 0;
        if(this._parameterCounts && this._parameterCounts[ name ] !== undefined) {
            retVal = this._parameterCounts[ name ];
        }
        return retVal;
    }
    /** gets a map of how many step items match a particular filter parameter */
    private getParameterCounts() {
        let retVal = {
            'CREATE': 0,
            'ADD': 0,
            'MERGE': 0,
            'LOW_SCORE_NAME':0,
            'LOW_SCORE_ADDRESS':0,
            'LOW_SCORE_PHONE':0
        }
        this.listSteps.forEach((step: SzResolutionStepListItem) => {
            if(step.actionType == SzResolutionStepDisplayType.CREATE) {
                retVal.CREATE = retVal.CREATE+1;
            }
            if(step.actionType == SzResolutionStepDisplayType.ADD) {
                retVal.ADD = retVal.ADD+1;
            }
            if(step.actionType == SzResolutionStepDisplayType.MERGE) {
                retVal.MERGE = retVal.MERGE+1;
            }
            if(step.MATCH_INFO && step.FEATURE_SCORES && step.FEATURE_SCORES['NAME'] && step.FEATURE_SCORES['NAME'].some){
                // check for low scoring name
                let _featScores = SzHowUIService.getFeatureScoreByType('NAME', step);
                let allFeaturesAreLowScoring = _featScores.every((featScore: SzSdkHowFeatureScore) => {
                    return !(featScore.SCORE > this.lowScoringFeatureThreshold);
                });
                if(allFeaturesAreLowScoring) {
                    retVal.LOW_SCORE_NAME = retVal.LOW_SCORE_NAME+1;
                }
            }
            if(step.MATCH_INFO && step.FEATURE_SCORES && step.FEATURE_SCORES['ADDRESS'] && step.FEATURE_SCORES['ADDRESS'].some){
                // check for low scoring address
                let _featScores = SzHowUIService.getFeatureScoreByType('ADDRESS', step);
                let allFeaturesAreLowScoring = _featScores.every((featScore: SzSdkHowFeatureScore) => {
                    return !(featScore.SCORE > this.lowScoringFeatureThreshold);
                });
                if(allFeaturesAreLowScoring) {
                    retVal.LOW_SCORE_ADDRESS = retVal.LOW_SCORE_ADDRESS+1;
                }
            }
            if(step.MATCH_INFO && step.FEATURE_SCORES && step.FEATURE_SCORES['PHONE'] && step.FEATURE_SCORES['PHONE'].some){
                // check for low scoring phone
                let _featScores = SzHowUIService.getFeatureScoreByType('PHONE', step);
                let allFeaturesAreLowScoring = _featScores.every((featScore: SzSdkHowFeatureScore) => {
                    return !(featScore.SCORE > this.lowScoringFeatureThreshold);
                });
                if(allFeaturesAreLowScoring) {
                    retVal.LOW_SCORE_PHONE = retVal.LOW_SCORE_PHONE+1;
                }
            }
        });

        console.log('SzHowNavComponent.getParameterCounts: ', retVal, this.listSteps);

        return retVal;
    }
    /**
     * @internal 
     * get a array of recordId's present in a particular step.
     */
    private getStepListItemRecords(step: SzSdkHowResolutionStep): string[] {
        let retVal = [];
        let _isEntity1Singleton = SzHowUIService.isVirtualEntitySingleton(step.VIRTUAL_ENTITY_1);
        let _isEntity2Singleton = SzHowUIService.isVirtualEntitySingleton(step.VIRTUAL_ENTITY_2);
        let getRecordIdsForVirtualEntity = (_virtualEntity: SzSdkVirtualEntity) => {
            let _isEntitySingleton = SzHowUIService.isVirtualEntitySingleton(_virtualEntity);
            let _retVal = [];
            if(_virtualEntity && _virtualEntity.MEMBER_RECORDS && _isEntitySingleton) {
                _virtualEntity.MEMBER_RECORDS.forEach((_memberRecord)=>{
                    if(_memberRecord.RECORDS){
                        _retVal = _retVal.concat(_memberRecord.RECORDS.map((_record)=>{
                            return _record.RECORD_ID;
                        }))
                    }
                });
            }
        }
        if(step && step.VIRTUAL_ENTITY_1 && step.VIRTUAL_ENTITY_1.MEMBER_RECORDS && _isEntity1Singleton) {
            retVal = retVal.concat(getRecordIdsForVirtualEntity(step.VIRTUAL_ENTITY_1));
            /*retVal = retVal.concat(step.candidateVirtualEntity.records.map((rec: SzVirtualEntityRecord)=>{
                return rec.recordId;
            }));*/
        }
        if(step && step.VIRTUAL_ENTITY_2 && step.VIRTUAL_ENTITY_2.MEMBER_RECORDS && _isEntity2Singleton) {
            retVal = retVal.concat(getRecordIdsForVirtualEntity(step.VIRTUAL_ENTITY_2));
            /*retVal = retVal.concat(step.inboundVirtualEntity.records.map((rec: SzVirtualEntityRecord)=>{
                return rec.recordId;
            }));*/
        }
        return retVal;
    }
    /**
     * @internal 
     * get a array of datasources present in a particular step.
     */
    private getStepListItemDataSources(step: SzSdkHowResolutionStep): string[] {
        let retVal = [];
        let getDataSourcesForVirtualEntity = (_virtualEntity: SzSdkVirtualEntity) => {
            //let _isEntitySingleton = SzHowUIService.isVirtualEntitySingleton(_virtualEntity);
            let _retVal = [];
            if(_virtualEntity && _virtualEntity.MEMBER_RECORDS) {
                _virtualEntity.MEMBER_RECORDS.forEach((_memberRecord)=>{
                    if(_memberRecord.RECORDS){
                        _retVal = _retVal.concat(_memberRecord.RECORDS.map((_record)=>{
                            return _record.DATA_SOURCE;
                        }))
                    }
                });
            }
        }
        if(step && step.VIRTUAL_ENTITY_1 && step.VIRTUAL_ENTITY_1.MEMBER_RECORDS) {
            retVal = retVal.concat(getDataSourcesForVirtualEntity(step.VIRTUAL_ENTITY_1));
        }
        if(step && step.VIRTUAL_ENTITY_2 && step.VIRTUAL_ENTITY_2.MEMBER_RECORDS) {
            retVal = retVal.concat(getDataSourcesForVirtualEntity(step.VIRTUAL_ENTITY_2));
        }
        return retVal;
    }
    /**
     * @internal 
     * get a array of text tokens in a particular step so a user can perform text searches for steps that 
     * contain particular terms.
     */
    private getStepListItemFreeTextTerms(step: SzResolutionStepListItem): string[] {
        let retVal = [];
        if(step.title) {
            retVal = retVal.concat(step.title.split(' '));
        }
        if(step.description && step.description.length > 0) {
            step.description.forEach((desc: {text: string, cssClasses: string[]}) => {
                retVal = retVal.concat(desc.text.split(' '));
            });
            retVal = retVal.concat(step.title.split(' '));
        }
        if(step && step.FEATURE_SCORES && Object.keys(step.FEATURE_SCORES).length > 0) {
            for(let fKey in step.FEATURE_SCORES) {
                let featBucket = step.FEATURE_SCORES[fKey];
                if(featBucket && featBucket.length > 0) {
                    // sort featBucket by highest score
                    featBucket = featBucket.sort((featA, featB) => {
                        return (featA.SCORE > featB.SCORE) ? -1 : 1;
                    });
                    // just take the top 1 result
                    if(featBucket && featBucket[0]) {
                        if(featBucket[0] && featBucket[0].INBOUND_FEAT_DESC && !retVal.includes(featBucket[0].INBOUND_FEAT_DESC)) {
                            retVal.push(featBucket[0].INBOUND_FEAT_DESC);
                        }
                        if(featBucket[0] && featBucket[0].CANDIDATE_FEAT_DESC && !retVal.includes(featBucket[0].CANDIDATE_FEAT_DESC)) {
                            retVal.push(featBucket[0].CANDIDATE_FEAT_DESC);
                        }
                    }
                }
            }
        }
        /*
        if(step.resolvedVirtualEntityId && this._virtualEntitiesById && this._virtualEntitiesById.has && this._virtualEntitiesById.has(step.resolvedVirtualEntityId)) {
            // add important data from result entity in to search
            let termsToAdd = [];
            let itemToScan  = this._virtualEntitiesById.get(step.resolvedVirtualEntityId);
            if(itemToScan.bestName) { 
                termsToAdd.push(itemToScan.bestName); 
            } else if(itemToScan.entityName) {
                termsToAdd.push(itemToScan.entityName); 
            }
            if(itemToScan.features && Object.keys(itemToScan.features).length > 0) {
                // has features, add them
                for(var _k in itemToScan.features) {
                    // each one of these items is an array
                    termsToAdd = termsToAdd.concat(itemToScan.features[_k].map((_f)=>{
                        return _f.primaryValue ? _f.primaryValue : undefined;
                    })).filter((_fVal) => { return _fVal && _fVal !== undefined; });
                }
            }
            retVal = retVal.concat(termsToAdd);
        }*/
        let ret = [...new Set(retVal)];
        //console.log(`getStepListItemFreeTextTerms()`, ret, step, this._virtualEntitiesById);
        return ret;
    }    
    /**
     * @internal
     * get the type of card that the step will be displayed as.
     */
    private getStepListCardType(step: SzSdkHowResolutionStep): SzResolutionStepDisplayType {
        return SzHowUIService.getResolutionStepCardType(step);
    }
    /**
     * @internal
     * get the title of a step to display in matches list
     */
    private getStepListItemTitle(step: SzSdkHowResolutionStep): string {
        let retVal = '';
        if(SzHowUIService.isCreateEntityStep(step)) {
            // both items are records
            retVal = 'Create Virtual Entity';
        } else if(SzHowUIService.isVirtualEntityMergeStep(step)) {
            // both items are virtual entities
            retVal = 'Merge Interim Entities';
        } else if(SzHowUIService.isAddRecordStep(step)) {
            // one of the items is record, the other is virtual
            retVal = 'Add Record to Virtual Entity';
        }
        return retVal;
    }
    /**
     * @internal
     * get the description for a step that is displayed in the matches list. 
     */
    private getStepListItemDescription(step: SzSdkHowResolutionStep): {text: string, cssClasses: string[]}[] {
        let retVal = [];

        if(step){
            let _isSingleton = SzHowUIService.isVirtualEntitySingleton(step.VIRTUAL_ENTITY_1);

            if(step.VIRTUAL_ENTITY_1 && SzHowUIService.isVirtualEntitySingleton(step.VIRTUAL_ENTITY_1)) {
                step.VIRTUAL_ENTITY_1.MEMBER_RECORDS.forEach((_memberRecord)=>{
                    retVal = retVal.concat(_memberRecord.RECORDS.map((rec: SzSdkVirtualEntityRecord) => {
                        return {text: (rec.DATA_SOURCE + ':'+ rec.RECORD_ID), cssClasses: ['candidate','singleton']};
                    }));
                });
            }
            if(step.VIRTUAL_ENTITY_2 && SzHowUIService.isVirtualEntitySingleton(step.VIRTUAL_ENTITY_2)) {
                step.VIRTUAL_ENTITY_2.MEMBER_RECORDS.forEach((_memberRecord)=>{
                    retVal = retVal.concat(_memberRecord.RECORDS.map((rec: SzSdkVirtualEntityRecord) => {
                        return {text: (rec.DATA_SOURCE + ':'+ rec.RECORD_ID), cssClasses: ['candidate','singleton']};
                    }));
                });
            }
            /*
            if(step.candidateVirtualEntity) {
                if(step.candidateVirtualEntity.singleton && step.candidateVirtualEntity.records) {
                    retVal = retVal.concat(step.candidateVirtualEntity.records.map((rec: SzVirtualEntityRecord) => {
                        return {text: (rec.dataSource + ':'+ rec.recordId), cssClasses: ['candidate','singleton']};
                    }));
                } else {
                    retVal.push({text: (`Virtual Entity ${step.candidateVirtualEntity.virtualEntityId}`), cssClasses: ['candidate']});
                }
            }
            if(step.inboundVirtualEntity) {
                if(step.inboundVirtualEntity.singleton && step.inboundVirtualEntity.records) {
                    retVal = retVal.concat(step.inboundVirtualEntity.records.map((rec: SzVirtualEntityRecord) => {
                        return {text: (rec.dataSource + ':'+ rec.recordId), cssClasses: ['inbound','singleton']};
                    }));
                } else {
                    retVal.push({text: (`Virtual Entity ${step.inboundVirtualEntity.virtualEntityId}`), cssClasses: ['inbound']});
                }
            }*/
            retVal.push({text: (`Virtual Entity ${step.RESULT_VIRTUAL_ENTITY_ID}`), cssClasses: ['resolved']});
        }
        return retVal;
    }
    /**
     * @internal
     * get the css classes to apply to steps in the matches list.
     */
    private getStepListItemCssClasses(step: SzSdkHowResolutionStep) {
        let listItemVerb    = this.getStepListCardType(step);
        let cssClasses      = [];
        if(listItemVerb === SzResolutionStepDisplayType.ADD)    { cssClasses = cssClasses.concat(['record', 'add']); }
        if(listItemVerb === SzResolutionStepDisplayType.CREATE) { cssClasses = cssClasses.concat(['virtual-entity','create']); }
        if(listItemVerb === SzResolutionStepDisplayType.MERGE)  { cssClasses = cssClasses.concat(['virtual-entity', 'merge']); }

        return cssClasses;
    }

    // ---------------------------------------- end filtered collection getters

    constructor(
        private howUIService: SzHowUIService
    ){}

    ngOnInit() {
        /** listen for virtual entities being lazily passed in */
        this._virtualEntitiesDataChange.pipe(
            takeUntil(this.unsubscribe$),
            filter((val) => { return val !== undefined; })
        ).subscribe((val) => {
            console.warn(`virtual entities changed: `, val);
            // this will change list data for search
            // re-initialize
            this._listSteps = this.getListSteps();
            console.warn(`re-initialized search data: `, this._listSteps);
        })
    }

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    /**
     * when a step is clicked this method collapses all other currently expanded steps, and expands the 
     * step specified and all ancestors in it's tree.
     */
    public stepClicked(step: SzSdkHowResolutionStep) {
        this.howUIService.selectStep(step.RESULT_VIRTUAL_ENTITY_ID);
    }
}
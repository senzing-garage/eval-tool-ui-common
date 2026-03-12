import { Component, HostBinding, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { Subject, take, takeUntil, tap } from 'rxjs';
import { SzCrossSourceCount, SzCrossSourceSummaryCategoryType } from '../../models/stats';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { isNotNull } from '../../common/utils';
import { SzPrefsService } from '../../services/sz-prefs.service';
import { SzSampleSetEntity, SzSampleSetRelation } from '../../models/data-sampling';

/**
 * @internal
 */
@Component({
    selector: 'sz-css-principle-dialog',
    templateUrl: 'sz-cross-source-principle-picker.component.html',
    styleUrls: ['sz-cross-source-matchkey-picker.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatRadioModule,
        MatIconModule
    ],
    standalone: true
})
  export class SzCrossSourceSummaryPrinciplePickerDialog implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _showOkButton = true;
    public _title: string = 'Filter by ER Code';
    public text: string;
    public buttonText: string = "Ok";
    private _data: Array<SzCrossSourceCount>;
    private _statType: SzCrossSourceSummaryCategoryType;
    private _selectedCount = 0;

    public get selectedPrinciple(): string {
        if(this.hasSelectedPrinciple) {
            return this.dataMartService.sampleSetPrinciple;
        }
        return undefined;
    }
    public set selectedPrinciple(value: string) {
        this.dataMartService.sampleSetPrinciple = value;
    }

    public get showDialogActions(): boolean {
      return this._showOkButton;
    }

    public get dataRows() {
        return this._data;
    }

    public get title() {
        let retVal = '';
        let selectedCount = this._selectedCount ? this._selectedCount : this.getSelectedCount(this._data, undefined, this._statType);

        if(this.hasSelectedPrinciple) {
            retVal = 'Choose ER Code (' + selectedCount + (selectedCount > 1 ? ' matching items)' : ' matching item)');
        } else {
            retVal  = 'Choose ER Code';
        }
        return retVal;
    }
    public get hasSelectedPrinciple(): boolean {
        if(this._statType !== this.dataMartService.sampleStatType) {
            return false;
        }
        return this.dataMartService.sampleSetPrinciple && this.dataMartService.sampleSetPrinciple !== '';
    }

    public onPrincipleFilterChange(value) {
        if(value && value.value) {
            this.dataMartService.doNotFetchSampleSetOnParameterChange = true;
            this.dataMartService.sampleSetPrinciple  = value;
            this._updateSampleData(value.value);
        }
    }

    /** we use this on click to immediately close the dialog on mouse click */
    public setPrinciple(value: string) {
        this._updateSampleData(value);
        this.dialogRef.close(true);
    }

    private _updateSampleData(principle: string) {
        console.log(`_updateSampleData: ${principle}`, principle);
        this.dataMartService.doNotFetchSampleSetOnParameterChange = true;
        let changeWholeSampleSet = false; // we don't want to fetch new requests 4 times while we change parameters
        if(this.dataMartService.sampleStatType !== this._statType) {
            changeWholeSampleSet = true;
            this.dataMartService.sampleStatType = this._statType;
        }
        if(this.dataMartService.dataSource1 !== this.dataMartService.sampleDataSource1) {
            changeWholeSampleSet = true;
            this.dataMartService.sampleDataSource1 = this.dataMartService.dataSource1;
        }
        if(this.dataMartService.dataSource2 !== this.dataMartService.sampleDataSource2) {
            changeWholeSampleSet = true;
            this.dataMartService.sampleDataSource2 = this.dataMartService.dataSource2;
        }
        this.dataMartService.sampleSetPrinciple  = principle;
        this.dataMartService.sampleSetPage       = 0;
        this.dataMartService.principleCounts      = this._data;

        if(isNotNull(this.dataMartService.sampleSetPrinciple)) {
            // get null principle count (total row)
            let totalItem = this._data.find((item)=>{ return !item.principle && !item.matchKey });
            let countKey = this._statType === SzCrossSourceSummaryCategoryType.MATCHES ? 'entityCount' : 'relationCount';

            console.info(`!!! totalItem: ${totalItem ? totalItem[countKey] : undefined}`, totalItem);
            if(totalItem) {
                this.dataMartService.sampleSetUnfilteredCount   = totalItem[countKey];
            }
        } else {
            console.warn(`setting unfiltered count to undefined `);
        }

        if(changeWholeSampleSet) {
            console.info(`\t_updateSampleData: `, this.dataMartService.sampleStatType,
            this.dataMartService.sampleDataSource1,
            this.dataMartService.sampleDataSource2,
            this.dataMartService.sampleSetMatchKey,
            this.dataMartService.sampleSetPrinciple,
            this.dataMartService.sampleSetUnfilteredCount);

            this.dataMartService.createNewSampleSetFromParameters(
                this.dataMartService.sampleStatType,
                this.dataMartService.sampleDataSource1,
                this.dataMartService.sampleDataSource2,
                this.dataMartService.sampleSetMatchKey,
                this.dataMartService.sampleSetPrinciple,
                undefined, undefined, undefined,
                this.dataMartService.sampleSetUnfilteredCount).pipe(
                  takeUntil(this.unsubscribe$),
                  take(1),
                  tap((data: Array<SzSampleSetEntity | SzSampleSetRelation>) => {
                    this.dataMartService.doNotFetchSampleSetOnParameterChange = false;
                  })
            )
        } else {
            // just update the data
            this.dataMartService.refreshSampleSet();
            this.dataMartService.doNotFetchSampleSetOnParameterChange = false;
        }
    }

    public isTotalRow(row: SzCrossSourceCount) {
        return row && !row.principle && !row.matchKey ? true : false;
    }

    public getSelectedCount(data?: Array<SzCrossSourceCount>, principle?: string, statType?: SzCrossSourceSummaryCategoryType) {
        let _tConnections = 0;
        let countKey = this._statType === SzCrossSourceSummaryCategoryType.MATCHES ? 'entityCount' : 'relationCount';
        data        = data ? data : this._data;
        principle   = principle ? principle : (this.dataMartService && this.dataMartService.sampleSetPrinciple ? this.dataMartService && this.dataMartService.sampleSetPrinciple : undefined);
        statType    = statType ? statType : this._statType;

        if(data && data.length && this.dataMartService.sampleSetPrinciple) {
            data.forEach((item)=> {
                if(item.principle === principle){
                    _tConnections = _tConnections + item[countKey];
                }
            });
            return _tConnections;
        } else if(!this.dataMartService.sampleSetPrinciple) {
            // just get the total
            let totalItem = data.find((item)=>{ return !item.principle && !item.matchKey });

            if(totalItem) {
                _tConnections = totalItem[countKey];
            }
        }
        this._selectedCount = _tConnections;
        return _tConnections;
    }

    public get currentlySelected() {
        let retVal = '';
        return retVal;
    }

    public clearPrinciple() {
        this.dataMartService.sampleSetPrinciple = undefined;
        this.dialogRef.close(true);
    }

    public getCount(row: SzCrossSourceCount) {
        let countKey = this._statType === SzCrossSourceSummaryCategoryType.MATCHES ? 'entityCount' : 'relationCount';
        return row && row[countKey] ? row[countKey] : 0;
    }

    @HostBinding("class.sample-type-ambiguous-matches") get classAmbiguousMatches() {
      return this._statType === SzCrossSourceSummaryCategoryType.AMBIGUOUS_MATCHES;
    }
    @HostBinding("class.sample-type-matches") get classMatches() {
      return this._statType === SzCrossSourceSummaryCategoryType.MATCHES;
    }
    @HostBinding("class.sample-type-possible-matches") get classPossibleMatches() {
      return this._statType === SzCrossSourceSummaryCategoryType.POSSIBLE_MATCHES;
    }
    @HostBinding("class.sample-type-possible-relations") get classPossibleRelations() {
      return this._statType === SzCrossSourceSummaryCategoryType.POSSIBLE_RELATIONS;
    }
    @HostBinding("class.sample-type-disclosed-relations") get classDisclosedRelations() {
      return this._statType === SzCrossSourceSummaryCategoryType.DISCLOSED_RELATIONS;
    }

    constructor(public dialogRef: MatDialogRef<SzCrossSourceSummaryPrinciplePickerDialog>,
        @Inject(MAT_DIALOG_DATA) public data: {
        data: Array<SzCrossSourceCount>,
        statType: SzCrossSourceSummaryCategoryType
        }, private dataMartService: SzDataMartService, private prefs: SzPrefsService) {
      if(data) {
        if(data) {
          this._data        = data.data;
          this._statType    = data.statType;
          console.info(`SzCrossSourceSummaryPrinciplePickerDialog: `, this._data);
        }
      }
    }

    /**
     * unsubscribe when component is destroyed
     * @internal
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    /**
     * sets up initial service listeners etc
     * @internal
     */
    ngOnInit() {}
  }

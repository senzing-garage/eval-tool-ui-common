import { Component, Inject, HostBinding, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { SzSdkHowResolutionStep, SzSdkVirtualEntityRecord } from '../models/grpc/engine';
import { SzResolutionStepDisplayType, SzResolvedVirtualEntity, SzVirtualEntityRecordsByDataSource } from '../models/data-how';
import { SzHowUIService } from '../services/sz-how-ui.service';
import { SzHowVirtualEntityCardComponent } from './cards/sz-how-virtual-entity-card.component';

/**
 * @internal
 */
@Component({
    selector: 'sz-dialog-how-rc-virtual-entity-dialog',
    templateUrl: 'sz-how-virtual-entity-dialog.component.html',
    styleUrls: ['sz-how-virtual-entity-dialog.component.scss'],
    imports: [
        CommonModule,
        MatDialogModule,
        MatIconModule,
        DragDropModule,
        SzHowVirtualEntityCardComponent
    ]
})
export class SzHowVirtualEntityDialog implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    private _stepData: SzSdkHowResolutionStep;
    private _virtualEntity: SzResolvedVirtualEntity;
    private _featureOrder: string[];
    private _sources: SzVirtualEntityRecordsByDataSource;

    private _showOkButton = true;
    private _isMaximized = false;

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
    @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
    private set maximized(value: boolean) { this._isMaximized = value; }

    public get title(): string {
        let retVal = `Virtual Entity ${this.id}`;
        if (this._stepData && this._stepData.STEP) {
            retVal = `Step ${this._stepData.STEP}: ` + retVal;
        }
        return retVal;
    }

    public okButtonText: string = 'Ok';
    public get showDialogActions(): boolean {
        return this._showOkButton;
    }
    public get id(): string {
        if (this._virtualEntity) {
            return this._virtualEntity.virtualEntityId;
        }
        return undefined;
    }
    public get stepData(): SzSdkHowResolutionStep {
        return this._stepData;
    }
    public get virtualEntity(): SzResolvedVirtualEntity {
        return this._virtualEntity;
    }
    public get featureOrder(): string[] {
        return this._featureOrder;
    }

    get displayType(): SzResolutionStepDisplayType {
        return SzHowUIService.getResolutionStepCardType(this._stepData);
    }
    get sourceCount(): number {
        let retVal = 0;
        let _sources = this.sources;
        if (_sources) {
            retVal = Object.keys(_sources).length;
        }
        return retVal;
    }
    get recordCount(): number {
        let retVal = 0;
        if (this._virtualEntity && this._virtualEntity.RECORDS !== undefined) {
            return this._virtualEntity.RECORDS.length;
        }
        return retVal;
    }
    get sources() {
        if (!this._sources && this._virtualEntity && this._virtualEntity.RECORDS) {
            let _recordsByDataSource: {
                [key: string]: Array<SzSdkVirtualEntityRecord>
            } = {};
            this._virtualEntity.RECORDS.forEach((dsRec) => {
                if (!_recordsByDataSource[dsRec.DATA_SOURCE]) {
                    _recordsByDataSource[dsRec.DATA_SOURCE] = [];
                }
                _recordsByDataSource[dsRec.DATA_SOURCE].push(dsRec);
            });
            this._sources = _recordsByDataSource;
        }
        return this._sources;
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: {
            stepData: SzSdkHowResolutionStep,
            virtualEntity: SzResolvedVirtualEntity,
            featureOrder: string[],
            okButtonText?: string, showOkButton?: boolean
        },
        private howUIService: SzHowUIService
    ) {
        if (data) {
            if (data.stepData) {
                this._stepData = data.stepData;
            }
            if (data.virtualEntity) {
                this._virtualEntity = data.virtualEntity;
            }
            if (data.featureOrder) {
                this._featureOrder = data.featureOrder;
            }
            if (data.okButtonText) {
                this.okButtonText = data.okButtonText;
            }
            if (data.showOkButton) {
                this._showOkButton = data.showOkButton;
            }
        }
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    public toggleMaximized() {
        this.maximized = !this.maximized;
    }
    public onDoubleClick(event: MouseEvent) {
        this.toggleMaximized();
    }
}

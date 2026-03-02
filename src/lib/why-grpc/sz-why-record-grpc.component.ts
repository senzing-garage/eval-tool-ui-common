import { Component, OnInit, Input, Inject, OnDestroy, Output, EventEmitter, ViewChild, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Observable, Subject, takeUntil, zip } from 'rxjs';
import { SzEngineFlags } from '@senzing/sz-sdk-typescript-grpc-web';

import { SzGrpcConfigManagerService } from '../services/grpc/configManager.service';
import { SzGrpcEngineService } from '../services/grpc/engine.service';
import { SzCSSClassService } from '../services/sz-css-class.service';
import { SzWhyReportBaseGrpcComponent } from './sz-why-report-base-grpc.component';
import {
    SzSdkWhyRecordInEntityResponse,
    SzSdkWhyRecordInEntityResult
} from '../models/grpc/why';
import { SzWhyGrpcFeatureRow, SzWhyGrpcEntityColumn } from '../models/data-why-grpc';

@Component({
    selector: 'sz-why-record-grpc',
    templateUrl: './sz-why-record-grpc.component.html',
    styleUrls: ['./sz-why-record-grpc.component.scss'],
    imports: [CommonModule]
})
export class SzWhyRecordGrpcComponent extends SzWhyReportBaseGrpcComponent implements OnInit, OnDestroy {
    protected override _data: SzSdkWhyRecordInEntityResult[];

    @Input() dataSourceCode: string;
    @Input() recordId: string;
    @Output() onResult: EventEmitter<SzSdkWhyRecordInEntityResult[]> = new EventEmitter<SzSdkWhyRecordInEntityResult[]>();

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

    protected override getData(): Observable<SzSdkWhyRecordInEntityResponse> {
        const flags = SzEngineFlags.SZ_WHY_RECORDS_DEFAULT_FLAGS |
            SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_FEATURES |
            SzEngineFlags.SZ_ENTITY_INCLUDE_FEATURE_STATS |
            SzEngineFlags.SZ_INCLUDE_FEATURE_SCORES;
        return this.engineService.whyRecordInEntity(this.dataSourceCode, this.recordId, flags) as Observable<SzSdkWhyRecordInEntityResponse>;
    }

    protected override onDataResponse(results: [SzSdkWhyRecordInEntityResponse, string[]]) {
        this._isLoading = false;
        this.loading.emit(false);
        this._data = results[0].WHY_RESULTS;
        this._entities = results[0].ENTITIES;
        if (results[1]) {
            this._orderedFeatureTypes = this._rows.map((fr) => fr.key).concat(results[1]);
        }
        this._featureStatsById = this.getFeatureStatsByIdFromEntityData(this._entities);
        this._featuresByDetailIds = this.getFeaturesByDetailIdFromEntityData(this._entities);
        this._shapedData = this.transformWhyRecordData(this._data, this._entities);
        this._formattedData = this.formatData(this._shapedData);
        this._rows = this.getRowsFromData(this._shapedData, this._orderedFeatureTypes);
        this._headers = this.getHeadersFromData(this._shapedData);
        this.onResult.emit(this._data);
        this.onRowsChanged.emit(this._rows);
    }
}

@Component({
    selector: 'sz-dialog-why-record-grpc',
    templateUrl: 'sz-why-record-grpc-dialog.component.html',
    styleUrls: ['sz-why-record-grpc-dialog.component.scss'],
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        DragDropModule,
        SzWhyRecordGrpcComponent
    ]
})
export class SzWhyRecordGrpcDialog implements OnDestroy {
    public unsubscribe$ = new Subject<void>();

    private _dataSourceCode: string;
    private _recordId: string;
    private _showOkButton = true;
    private _isMaximized = false;
    private _isLoading = true;
    public get isLoading(): boolean {
        return this._isLoading;
    }
    @HostBinding('class.maximized') get maximized() { return this._isMaximized; }
    private set maximized(value: boolean) { this._isMaximized = value; }

    @ViewChild('whyRecordTag') whyRecordTag: SzWhyRecordGrpcComponent;

    public get title(): string {
        return `Why Record ${this._dataSourceCode}:${this._recordId}`;
    }

    public okButtonText: string = 'Ok';
    public get showDialogActions(): boolean {
        return this._showOkButton;
    }

    public get dataSourceCode(): string {
        return this._dataSourceCode;
    }
    public get recordId(): string {
        return this._recordId;
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: {
            DATA_SOURCE: string;
            RECORD_ID: string;
            okButtonText?: string;
            showOkButton?: boolean;
        },
        private cssClassesService: SzCSSClassService
    ) {
        if (data) {
            if (data.DATA_SOURCE) {
                this._dataSourceCode = data.DATA_SOURCE;
            }
            if (data.RECORD_ID) {
                this._recordId = data.RECORD_ID;
            }
            if (data.okButtonText) {
                this.okButtonText = data.okButtonText;
            }
            if (data.showOkButton !== undefined) {
                this._showOkButton = data.showOkButton;
            }
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
}

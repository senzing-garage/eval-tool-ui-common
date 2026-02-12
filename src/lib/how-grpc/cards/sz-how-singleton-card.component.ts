import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SzSdkVirtualEntityRecord } from '../../models/grpc/engine';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzHowStepCardBase } from './sz-how-card-base.component';

/**
 * @internal
 *
 * Card component for singleton virtual entities in the how report.
 * Singletons are base building blocks — single records that haven't
 * been resolved with any other record yet.
 *
 * @example
 * <!-- (Angular) -->
 * <sz-how-singleton-card [data]="data" [virtualEntitiesById]="virtualEntitiesById"></sz-how-singleton-card>
 *
*/
@Component({
    selector: 'sz-how-singleton-card',
    templateUrl: './sz-how-singleton-card.component.html',
    styleUrls: ['./sz-how-card-base.component.scss'],
    imports: [CommonModule]
})
export class SzHowSingletonCardComponent extends SzHowStepCardBase implements OnInit, OnDestroy {
    override get title(): string {
        let retVal = '';
        if(this.isSingleton) {
            retVal = 'Record';
            if(this.dataRecords && this.dataRecords.length > 1) {
                retVal += 's';
            }
        }
        return retVal;
    }

    get dataRecords(): SzSdkVirtualEntityRecord[] {
        let retVal: SzSdkVirtualEntityRecord[] = [];
        if(this._data && this._data.MEMBER_RECORDS) {
            this._data.MEMBER_RECORDS.forEach((mr) => {
                if(mr.RECORDS) {
                    retVal = retVal.concat(mr.RECORDS);
                }
            });
        }
        return retVal;
    }

    constructor(
        howUIService: SzHowUIService
    ){
        super(howUIService);
    }
}

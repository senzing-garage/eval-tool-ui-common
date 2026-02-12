import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SzResolutionStepDisplayType, SzResolutionStepNode } from '../../models/data-how';
import { SzHowUIService } from '../../services/sz-how-ui.service';
import { SzHowStepCardBase } from './sz-how-card-base.component';

/**
 * @internal
 *
 * This is the basic card that represents a step in the how report for an entity.
 * The cards will display the step number, title, match keys, and inbound and outbound
 * features and scores etc.
 *
 * @example
 * <!-- (Angular) -->
 * <sz-how-step-card [data]="data" [virtualEntitiesById]="virtualEntitiesById"></sz-how-step-card>
 *
*/
@Component({
    selector: 'sz-how-step-card',
    templateUrl: './sz-how-step-card.component.html',
    styleUrls: ['./sz-how-card-base.component.scss'],
    imports: [CommonModule, MatIconModule]
})
export class SzHowStepCardComponent extends SzHowStepCardBase implements OnInit, OnDestroy {

    override get title(): string {
        let retVal = '';
        let displayType: SzResolutionStepDisplayType = this.getStepListItemCardType(this._data);

        if(displayType === SzResolutionStepDisplayType.INTERIM) {
            let _resolvedEntity = this.resolvedVirtualEntity;
            if(_resolvedEntity) {
                retVal = `${_resolvedEntity.virtualEntityId}: Interim Entity: ${_resolvedEntity.ENTITY_NAME}`;
            }
        } else if(displayType === SzResolutionStepDisplayType.CREATE) {
            let _resolvedEntity = this.resolvedVirtualEntity;
            retVal = 'Create Virtual Entity'+ (_resolvedEntity && _resolvedEntity.virtualEntityId ? ' '+_resolvedEntity.virtualEntityId : '');
        } else if(displayType === SzResolutionStepDisplayType.MERGE) {
            retVal = 'Merge Interim Entities';
        } else if(displayType === SzResolutionStepDisplayType.ADD) {
            retVal = 'Add Record to Virtual Entity';
        }
        return (displayType !== SzResolutionStepDisplayType.INTERIM) ? `Step ${this._data.STEP}: ${retVal}` : retVal;
    }

    override get description(): string[] {
        let retVal = [];
        if(this._data) {
            let eType = this.isInterimStep && this.hasChildren ? 'Interim Entity' : 'Virtual Entity';
            retVal.push(`Forms <span class="emphasized">${eType} <span class="nw">${this._data.RESULT_VIRTUAL_ENTITY_ID}</span></span>`);
            if(this._data.MATCH_INFO && this._data.MATCH_INFO.MATCH_KEY) {
                let _mkTokens = this.getMatchKeyAsObjects(this._data.MATCH_INFO.MATCH_KEY);
                let _desc = `On `;
                _mkTokens.forEach((value: boolean, token: string) => {
                    _desc += `<div class="emphasized ilb">${value ? '+' : '-'}${token}</div>`;
                });
                retVal.push(_desc);
            }
            if(this._data.MATCH_INFO && this._data.MATCH_INFO.ERRULE_CODE && this.showResolutionRule) {
                retVal.push(`Using <span class="emphasized">${this._data.MATCH_INFO.ERRULE_CODE}</span>`);
            }
        }
        return retVal;
    }

    constructor(
        howUIService: SzHowUIService
    ){
        super(howUIService);
    }
}

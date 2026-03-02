import { Component, Input, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SzResolutionStepDisplayType, SzResolutionStepListItemType, SzResolutionStepNode, SzResolvedVirtualEntity } from '../models/data-how';
import { SzSdkHowResolutionStep } from '../models/grpc/engine';
import { Subject } from 'rxjs';
import { SzHowUIService } from '../services/sz-how-ui.service';
import { SzHowStepCardComponent } from './cards/sz-how-step-card.component';

/**
 * How Step Stack (multiple steps represented as a collapsible group)
 *
 * @internal
 *
 * @example
 * <!-- (Angular) -->
 * <sz-how-step-stack></sz-how-step-stack>
 *
*/
@Component({
    selector: 'sz-how-step-stack',
    templateUrl: './sz-how-step-stack.component.html',
    styleUrls: ['./sz-how-step-stack.component.scss'],
    imports: [CommonModule, MatIconModule, SzHowStepCardComponent]
})
export class SzHowStepStackComponent implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    private _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    private _data: SzResolutionStepNode;

    @HostBinding('class.collapsed') get cssHiddenClass(): boolean {
        return !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.expanded') get cssExpandedClass(): boolean {
        return this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.group-collapsed') get cssHiddenGroupClass(): boolean {
        return !this.howUIService.isGroupExpanded(this.id);
    }
    @HostBinding('class.group-expanded') get cssExpandedGroupClass(): boolean {
        return this.howUIService.isGroupExpanded(this.id);
    }

    @Input() set data(value: SzResolutionStepNode) {
        this._data = value;
    }
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        this._virtualEntitiesById = value;
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }

    public get id(): string {
        return this._data && this._data.id ? this._data.id : undefined;
    }

    public get data(): SzResolutionStepNode {
        return this._data;
    }
    get itemType(): SzResolutionStepListItemType {
        return (this._data as SzResolutionStepNode).itemType ? (this._data as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP;
    }

    public get isGroupCollapsed() {
        return !this.howUIService.isGroupExpanded(this.id);
    }

    public toggleExpansion(vId?: string) {
        vId = vId ? vId : this.id;
        this.howUIService.toggleExpansion(vId, undefined, this.itemType);
    }
    public toggleGroupExpansion(gId?: string) {
        gId = gId ? gId : this.id;
        this.howUIService.toggleExpansion(undefined, gId, this.itemType);
    }

    get numberOfCards(): number {
        let retVal = 0;
        if(this._data && this._data.virtualEntityIds && this._data.virtualEntityIds.length) {
            retVal = this._data.virtualEntityIds.length;
        }
        return retVal;
    }

    getCardTitleForStep(title: string, cardIndex: number) {
        return cardIndex === 0 ? title : undefined;
    }

    get title(): string {
        let retVal = 'Steps';
        if(this._data && this._data.children) {
            let _retTypes = new Map<SzResolutionStepDisplayType, number>();
            this._data.children.forEach((step: SzSdkHowResolutionStep) => {
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
        return retVal;
    }

    public siblingsOf(step: SzSdkHowResolutionStep | SzResolutionStepNode) {
        return this._data.children.filter((n) => {
            return n !== step;
        });
    }

    constructor(
        private howUIService: SzHowUIService
    ){}

    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}

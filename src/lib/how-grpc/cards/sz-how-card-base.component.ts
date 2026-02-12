import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, HostBinding } from '@angular/core';
import { SzResolutionStepListItemType, SzResolutionStepDisplayType, SzResolutionStepNode, SzResolvedVirtualEntity } from '../../models/data-how';
import { SzSdkHowResolutionStep, SzSdkSearchRecordSummary } from '../../models/grpc/engine';
import { Subject } from 'rxjs';
import { SzHowUIService } from '../../services/sz-how-ui.service';

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
    protected _virtualEntitiesById: Map<string, SzResolvedVirtualEntity>;
    protected _highlighted: boolean = false;
    protected _groupId: string;

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
    @HostBinding('class.type-final') get cssTypeClass(): boolean {
        return false;
    }
    @HostBinding('class.group-collapsed') get cssGroupCollapsedClass(): boolean {
        let _grpId = this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
        return _grpId ? !this.howUIService.isGroupExpanded(_grpId) : false;
    }
    @HostBinding('class.group-expanded') get cssGroupExpandedClass(): boolean {
        let _grpId = this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
        return _grpId ? this.howUIService.isGroupExpanded(_grpId) : false;
    }
    @HostBinding('class.unresolved') get cssUnResolvedClass(): boolean {
        return false;
    }

    // ------------------------------ getters and setters -----------------------------
    @Input() public set virtualEntitiesById(value: Map<string, SzResolvedVirtualEntity>) {
        if(this._virtualEntitiesById === undefined && value !== undefined) {
            this._virtualEntitiesById = value;
        }
        this._virtualEntitiesById = value;
    }
    @Input() set data(value: SzResolutionStepNode) {
        this._data = value;
    }
    @Input() set groupId(value: string) {
        this._groupId = value;
    }

    @Output()
    onExpand: EventEmitter<boolean> = new EventEmitter<boolean>();

    public toggleExpansion(vId?: string) {
        vId = vId ? vId : this.id;
        this.howUIService.toggleExpansion(vId, undefined, this.itemType);
    }

    protected get id(): string {
        return this._data && this._data.id ? this._data.id : this._data && this._data.RESULT_VIRTUAL_ENTITY_ID ? this._data.RESULT_VIRTUAL_ENTITY_ID : undefined;
    }
    protected get itemType(): SzResolutionStepListItemType {
        return (this._data as SzResolutionStepNode).itemType ? (this._data as SzResolutionStepNode).itemType : SzResolutionStepListItemType.STEP;
    }
    protected get isGroup() {
        let _d = this._data;
        return ((_d as SzResolutionStepNode).itemType === SzResolutionStepListItemType.GROUP)
    }
    protected get hasChildren(): boolean {
        return (this._data as SzResolutionStepNode).children && (this._data as SzResolutionStepNode).children.length > 0;
    }
    get data() : SzResolutionStepNode {
        return this._data;
    }
    get groupId(): string {
        return this._groupId ? this._groupId : (this.isGroup ? this.id : undefined);
    }
    public get virtualEntitiesById(): Map<string, SzResolvedVirtualEntity> {
        return this._virtualEntitiesById;
    }
    public get title(): string {
        return '';
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
    public get resolvedVirtualEntity(): SzResolvedVirtualEntity {
        let retVal;
        if(this._virtualEntitiesById && this._virtualEntitiesById.has(this.id)) {
            let retVal = this._virtualEntitiesById.get(this.id);
            return retVal;
        }
        return retVal;
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

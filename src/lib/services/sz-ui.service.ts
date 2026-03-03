import { Injectable, Output, EventEmitter } from '@angular/core';

import { SzSdkResolvedEntity, SzSdkRelatedEntity } from '../models/grpc/engine';

/** @internal */
export interface RelationshipHoverEvent {
  resolvedEntity: SzSdkResolvedEntity,
  relatedEntities: SzSdkRelatedEntity[]
}

/**
 * Provides global level UI eventing.
 * Used for things like hover tooltips, collapse/expand,
 * Component state changes etc.
 *
 * @export
 */
@Injectable({
  providedIn: 'root'
})
export class SzUIEventService {
  @Output() onRelationshipHover: EventEmitter<RelationshipHoverEvent> = new EventEmitter<RelationshipHoverEvent>();
  @Output() onRelationshipOver: EventEmitter<RelationshipHoverEvent> = new EventEmitter<RelationshipHoverEvent>();
  @Output() onRelationshipOut: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() {}
}

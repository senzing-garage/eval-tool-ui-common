import { SzEntityIdentifier } from './grpc/engine';

/** 
 * extends a dom mouse event with entity specific properties.
 * @internal
 */
export interface SzEntityMouseEvent extends MouseEvent {
    entityId: SzEntityIdentifier
}
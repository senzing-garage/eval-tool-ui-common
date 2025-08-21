import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { SzGraphControlComponent } from '../../../graph-grpc/sz-graph-control.component';
import { CommonModule } from '@angular/common';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-entity-detail-graph-control',
    templateUrl: '../../../graph-grpc/sz-graph-control.component.html',
    styleUrls: ['../../../graph-grpc/sz-graph-control.component.scss'],
    imports: [
      CommonModule
    ]
})
export class SzEntityDetailGraphControlComponent extends SzGraphControlComponent {
  constructor(
    private _prefs: SzPrefsService
  ) {
    super(_prefs);
  }
}

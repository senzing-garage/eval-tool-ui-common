import { Component, ChangeDetectorRef, ViewContainerRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms';
import { Overlay } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzDataSourcesService } from '../../../services/sz-datasources.service';
import { SzGraphStorageService } from '../../../services/sz-graph-storage.service';
import { SzGraphFilterComponent } from '../../../graph-grpc/sz-graph-filter.component';

/**
 * Control Component allowing UI friendly changes
 * to filtering, colors, and parameters of graph control.
 *
 * integrated with graph preferences and prefBUS.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-entity-detail-graph-filter #graphFilter
      [showLinkLabels]="true"
      (optionChanged)="onOptionChange($event)"
      ></sz-entity-detail-graph-filter>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-wc-standalone-graph-filters id="sz-entity-detail-graph-filter"></sz-wc-standalone-graph-filters>
 * <script>
 * document.getElementById('sz-wc-standalone-graph-filters').addEventListener('optionChanged', function(data) { console.log('filter(s) changed', data); });
 * </script>
 */
@Component({
    selector: 'sz-entity-detail-graph-filter',
    templateUrl: '../../../graph-grpc/sz-graph-filter.component.html',
    styleUrls: ['../../../graph-grpc/sz-graph-filter.component.scss'],
    imports: [
      CommonModule, ReactiveFormsModule, FormsModule,
      MatSliderModule, MatCheckboxModule, MatInputModule, MatButtonModule,
      MatChipsModule, MatBadgeModule, MatIconModule, MatTooltipModule,
      DragDropModule,
    ]
})
export class SzEntityDetailGraphFilterComponent extends SzGraphFilterComponent {
  constructor(
    _p_prefs: SzPrefsService,
    _p_dataSourcesService: SzDataSourcesService,
    _p_formBuilder: UntypedFormBuilder,
    _p_cd: ChangeDetectorRef,
    _p_overlay: Overlay,
    _p_viewContainerRef: ViewContainerRef,
    _p_graphStorageService: SzGraphStorageService,
    _p_dialog: MatDialog,
  ) {
    super(
      _p_prefs,
      _p_dataSourcesService,
      _p_formBuilder,
      _p_cd,
      _p_overlay,
      _p_viewContainerRef,
      _p_graphStorageService,
      _p_dialog
    );
  }
}

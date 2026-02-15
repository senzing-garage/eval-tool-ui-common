import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  SzStandaloneGraphComponent,
  SzEntityDetailGraphFilterComponent,
  SzPrefsService
} from '@senzing/eval-tool-ui-common';

@Component({
  selector: 'app-graph-view',
  imports: [
    CommonModule,
    SzStandaloneGraphComponent,
    SzEntityDetailGraphFilterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class GraphViewComponent {
  public graphIds: number[] = [1];
  public showLinkLabels = false;
  public showDataSourcesInFilter: string[];
  public showMatchKeysInFilter: string[];
  public showFilters = true;

  @ViewChild(SzStandaloneGraphComponent) graphComponent: SzStandaloneGraphComponent;

  constructor(public prefs: SzPrefsService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      if (params['entityId']) {
        const entityId = parseInt(params['entityId'], 10);
        if (!isNaN(entityId)) {
          this.graphIds = [entityId];
        }
      }
    });
  }

  public onEntityClick(event: any) {
    console.log('entityClick: ', event);
  }

  public onEntityDblClick(event: any) {
    console.log('entityDblClick: ', event);
  }

  public onContextMenuClick(event: any) {
    console.log('contextMenuClick: ', event);
  }

  public onDataLoaded(event: any) {
    console.log('dataLoaded: ', event);
  }

  public onDataSourcesChange(event: string[]) {
    console.log('dataSourcesChange: ', event);
    this.showDataSourcesInFilter = event;
  }

  public onMatchKeysChange(event: string[]) {
    console.log('matchKeysChange: ', event);
    this.showMatchKeysInFilter = event;
  }

  public onRequestStarted(event: any) {
    console.log('requestStarted: ', event);
  }

  public onRequestComplete(event: any) {
    console.log('requestComplete: ', event);
  }

  public onRenderComplete(event: any) {
    console.log('renderComplete: ', event);
  }

  public onFilterOptionChange(event: { name: string, value: any }) {
    console.log('filterOptionChange: ', event);
    if (event.name === 'showLinkLabels') {
      this.prefs.graph.showLinkLabels = event.value;
    }
  }

  public toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}

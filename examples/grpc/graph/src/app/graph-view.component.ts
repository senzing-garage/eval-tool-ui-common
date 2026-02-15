import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  SzStandaloneGraphComponent,
  SzEntityDetailGraphFilterComponent,
  SzPrefsService,
  SzGraphExport
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

  public onExportGraph(): void {
    if (!this.graphComponent || !this.graphComponent.graphNetworkComponent) {
      console.warn('Graph network component not available for export');
      return;
    }
    const exportData = this.graphComponent.graphNetworkComponent.toJSON();
    // overlay graph prefs
    exportData.graphPrefs = this.prefs.graph.toJSONObject() as any;
    // build filename from primary/focal entity names
    const primaryNames = exportData.nodes
      .filter(n => n.isPrimaryEntity || n.isQueriedNode)
      .map(n => (n.name || '').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_'))
      .filter(n => n.length > 0);
    const prefix = 'sz-graph-';
    const ext = '.json';
    // 255 is the minimum max filename length across NTFS, APFS, and ext4
    const maxLen = 255;
    const namePart = primaryNames.length > 0 ? primaryNames.join('-') : 'export';
    const truncated = namePart.slice(0, maxLen - prefix.length - ext.length);
    const filename = `${prefix}${truncated}${ext}`.toLowerCase();
    // trigger file download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  public onImportGraph(data: SzGraphExport): void {
    if (!this.graphComponent || !this.graphComponent.graphNetworkComponent) {
      console.warn('Graph network component not available for import');
      return;
    }
    // restore prefs first so filters are applied during render
    if (data.graphPrefs) {
      this.prefs.graph.fromJSONObject(data.graphPrefs as any);
    }
    // restore graph IDs to trigger a re-fetch, then apply node state
    if (data.query && data.query.graphIds) {
      this.graphIds = data.query.graphIds;
    }
    this.graphComponent.graphNetworkComponent.fromJSON(data);
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  SzCrossSourceStatistics,
  SzCrossSourceSummarySelectionClickEvent
} from '@senzing/eval-tool-ui-common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SzCrossSourceStatistics
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public onLoading(isLoading: boolean) {
    console.log('loading: ', isLoading);
  }

  public onCellClick(event: any) {
    console.log('cellClick: ', event);
  }

  public onSourceStatisticClick(event: SzCrossSourceSummarySelectionClickEvent) {
    console.log('sourceStatisticClick: ', event);
  }
}

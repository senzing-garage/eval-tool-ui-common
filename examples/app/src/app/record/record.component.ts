import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  SzEntitySearchParams,
  SzEntityRecord,
  SzSearchByIdFormParams,
  SzEntityRecordViewerComponent,
  SzSdkEntityRecord
} from '@senzing/sdk-components-grpc-web';
import { SpinnerService } from '../services/spinner.service';
import { EntitySearchService } from '../services/entity-search.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SzEntityRecordCardComponent } from 'deprecated/entity/sz-entity-record-card/sz-entity-record-card.component';

@Component({
  selector: 'app-search-record',
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.scss'],
  imports: [
    CommonModule,
    SzEntityRecordViewerComponent
  ]
})
export class SearchRecordComponent implements OnInit, OnDestroy {
  public unsubscribe$ = new Subject<void>();
  /** the current search results */
  public currentSearchResult: SzSdkEntityRecord;
  public currentSearchParameters: SzSearchByIdFormParams;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService,
    private titleService: Title,
    private spinner: SpinnerService) {}

  ngOnInit() {
    this.route.data
    .pipe(
      takeUntil(this.unsubscribe$),
    )
    .subscribe((data: SzSdkEntityRecord | {result: SzSdkEntityRecord, parameters: SzSearchByIdFormParams }) => {
      if((data as SzSdkEntityRecord) && (data as SzSdkEntityRecord).RECORD_ID) {
        // data came straight from service call
        this.currentSearchResult = (data as SzSdkEntityRecord);
        this.currentSearchParameters = this.search.currentSearchByIdParameters;
      } else if((data as {result: SzSdkEntityRecord, parameters: SzSearchByIdFormParams }) && (data as {result: SzSdkEntityRecord, parameters: SzEntitySearchParams }).result) {
        const _dataAsRestModel = (data as {result: SzSdkEntityRecord, parameters: SzSearchByIdFormParams });
        this.currentSearchParameters = _dataAsRestModel.parameters;
        this.currentSearchResult = _dataAsRestModel.result;
      }
      // clear out any globally stored value;
      this.search.currentlySelectedEntityId = undefined;
      // set page title
      this.titleService.setTitle( this.search.searchTitle );
    });

    // listen for global search data
    this.search.record.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((result: SzSdkEntityRecord) => {
      // console.log('updated record data: ', result);
      this.currentSearchResult = result;
      // set page title
      this.titleService.setTitle( this.search.searchTitle );
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe( (event) => {
      this.spinner.hide();
    });

  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

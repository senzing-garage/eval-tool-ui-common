import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';

/*import {
  SzEntitySearchParams,
  SzAttributeSearchResult,
  SzEntityRecord,
  SzEntityData,
  SzSearchByIdFormParams
} from '@senzing/sdk-components-ng';
*/

import { 
  SzEntityDetailGrpcComponent,
  SzEntityIdentifier, SzEntitySearchParams
} from '@senzing/sz-sdk-components-grpc-web';

// new grpc components
import {
  SzSearchGrpcComponent, 
  SzSearchResultsGrpcComponent,
  SzGrpcConfigManagerService
} from '@senzing/sz-sdk-components-grpc-web';
// new grpc models
import { 
  SzSdkSearchResolvedEntity, 
  //SzSearchByIdFormParams,
  SzSdkSearchResult,
  SzGrpcConfig,
} from '@senzing/sz-sdk-components-grpc-web';
import { TipsComponent } from '../common/tips/tips.component';
import { EntitySearchService } from '../services/entity-search.service';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { PrefsManagerService } from '../services/prefs-manager.service';
import { SzWebAppConfigService } from '../services/config.service';
import { NavItem } from '../sidenav/sidenav.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  imports: [
    CommonModule,
    TipsComponent,
    MatIconModule,
    SzSearchGrpcComponent,
    SzSearchResultsGrpcComponent
  ],
  styleUrls: ['./search.component.scss']
})
export class AppSearchComponent implements OnInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    /** the current search results */
    public currentSearchResults: SzSdkSearchResult[];
    /** the entity to show in the detail view */
    public currentlySelectedEntityId: number = undefined;
    /** the search parameters from the last search performed */
    public currentSearchParameters: SzEntitySearchParams;

    public currentSearchResultsHumanReadable: string | undefined;

    private _openResultLinksInGraph = false;
    private _openSearchResultsInGraph = false;

    public get openResultLinksInGraph() {
      return this._openResultLinksInGraph;
    }
    public get openSearchResultsInGraph() {
      return this._openSearchResultsInGraph;
    }

    constructor(
        private configService: SzWebAppConfigService,
        private entitySearchService: EntitySearchService,
        private router: Router,
        private route: ActivatedRoute,
        public breakpointObserver: BreakpointObserver,
        private spinner: SpinnerService,
        private ui: UiService,
        private titleService: Title,
        public uiService: UiService,
        public search: EntitySearchService,
        private prefsManager: PrefsManagerService
    ) {
        // get "/config/api" for immutable api path configuration
        this.configService.getRuntimeApiConfig();
        this.route
          .data
          .subscribe((params) => {
            console.log("route params",params);
            if(params && params['openResultLinksInGraph'] !== undefined) {
              this._openResultLinksInGraph = params['openResultLinksInGraph'];
            }
            if(params && params['openSearchResultsInGraph'] !== undefined) {
              this._openSearchResultsInGraph = params['openSearchResultsInGraph'];
            }
          });
    }

    ngOnInit() {
        /*
        const layoutChanges = this.breakpointObserver.observe(this.layoutMediaQueries);
        layoutChanges.pipe(
            takeUntil(this.unsubscribe$)
        ).subscribe( this.onBreakPointStateChange.bind(this) );
        */
        this.route.data
            .subscribe((data: { results: SzSdkSearchResult[], parameters: SzEntitySearchParams }) => {
            this.currentSearchParameters = data.parameters;
            this.currentSearchResults = data.results;
            // clear out any globally stored value;
            this.search.currentlySelectedEntityId = undefined;
            // set page title
            this.titleService.setTitle( this.search.searchTitle );
            this.currentSearchResultsHumanReadable = this.search.searchTitle;
        });

        // listen for global search data
        this.search.results.subscribe((results: SzSdkSearchResult[]) => {
            this.currentSearchResults = results;
            // set page title
            this.titleService.setTitle( this.search.searchTitle );
            this.currentSearchResultsHumanReadable = this.search.searchTitle;
            // stop spinner (jic)
            this.spinner.hide();
        });

        if(this.search.currentSearchResults) {
            this.currentSearchResults = this.search.currentSearchResults;
        }
    }
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
        this.spinner.hide();
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    
    /**
     * Event handler for when a search has been performed in
     * the SzSearchComponent.
     */
    onSearchResults(evt: SzSdkSearchResult[]) {
        console.info('onSearchResultsChange: ', evt);
        this.spinner.hide();
        this.entitySearchService.currentSearchResults = evt;

        if (this.openSearchResultsInGraph) {
            // show results in graph
            this.onOpenInGraph();
        }
    }

  /**
   * Event handler for when the fields in the SzSearchComponent
   * are cleared.
   */
  public onSearchResultsCleared(searchParams: void) {
    // hide search results
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.router.navigate(['/search']);
  }

  /**
   * Event handler for when the parameters of the search performed from
   * the SzSearchComponent | SzSearchByIdComponent has changed.
   * This only happens on submit button click
   */
  //public onSearchParameterChange(searchParams: SzEntitySearchParams | SzSearchByIdFormParams) {
  public onSearchParameterChange(searchParams: SzEntitySearchParams) {

    //console.log('onSearchParameterChange: ', searchParams);
    let isByIdParams = false;
    /*
    const byIdParams = (searchParams as SzSearchByIdFormParams);
    if ( byIdParams && ((byIdParams.dataSource && byIdParams.recordId) || byIdParams.entityId)  ) {
      isByIdParams = true;
    } else {
      // console.warn('not by id: ' + isByIdParams, byIdParams);
    }*/
    if (!isByIdParams) {
      this.entitySearchService.currentSearchParameters = (searchParams as SzEntitySearchParams);
      this.currentSearchParameters = this.entitySearchService.currentSearchParameters;
    } else {
      //this.entitySearchService.currentSearchByIdParameters = (searchParams as SzSearchByIdFormParams);
    }
  }

  public onSearchStart(evt) {
    console.log('onSearchStart: ', evt);
    this.spinner.show();
  }
  public onSearchEnd(evt) {
    console.log('onSearchStart: ', evt);
    this.spinner.hide();
  }
  /** when user clicks on a search result item */
  onSearchResultClick(entity: SzSdkSearchResolvedEntity) {
    if(!this._openResultLinksInGraph){
      this.router.navigate(['search/by-attribute/entity/' + entity.ENTITY_ID]);
    } else {
      this.router.navigate(['graph/' + entity.ENTITY_ID]);
    }
  }
  /** when user clicks the "open results in graph" button */
  onOpenInGraph($event?) {
    const entityIds = this.currentSearchResults.map( (ent) => {
      return ent.ENTITY.RESOLVED_ENTITY.ENTITY_ID;
    });
    if(entityIds && entityIds.length === 1) {
      // single result
      this.router.navigate(['graph/' + entityIds[0] ]);
    } else if(entityIds && entityIds.length > 1) {
      // multiple matches
      this.router.navigate(['graph/' + entityIds.join(',') ]);
    }
  }

}

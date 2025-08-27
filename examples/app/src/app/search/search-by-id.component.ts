import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';

/*import {
  SzEntitySearchParams,
  SzEntityDetailSectionData,
  SzAttributeSearchResult,
  SzEntityRecord,
  SzEntityData,
  SzSearchByIdFormParams
} from '@senzing/sdk-components-ng';
*/

import { 
  SzEntityRecord,
  SzSearchByIdFormParams,
  SzSearchByIdGrpcComponent,
  SzSdkSearchResult, SzEntitySearchParams,
  SzSearchResultCardGrpcComponent,
  SzSdkResolvedEntity,
  SzEntityRecordViewerComponent,
  SzSdkEntityRecord
} from '@senzing/sz-sdk-components-grpc-web';

import { EntitySearchService } from '../services/entity-search.service';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { PrefsManagerService } from '../services/prefs-manager.service';
import { SzWebAppConfigService } from '../services/config.service';

@Component({
  selector: 'app-search-by-id',
  templateUrl: './search-by-id.component.html',
  styleUrls: ['./search-by-id.component.scss'],
  imports: [ CommonModule, 
    SzSearchByIdGrpcComponent, SzEntityRecordViewerComponent ,
    SzSearchResultCardGrpcComponent
  ]
})
export class AppSearchByIdComponent implements OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** the current search results */
  public currentSearchResults: SzSdkSearchResult[];
  /** the entity to show in the detail view */
  public currentlySelectedEntityId: number = undefined;
  /** the search parameters from the last search performed */
  public currentSearchParameters: SzEntitySearchParams;

  public get currentSearchParametersHumanReadable(): string | undefined {
    let retVal = undefined;
    if(this.entitySearchService.currentSearchByIdParameters) {
      if(this.entitySearchService.currentSearchByIdParameters.recordId) {
        retVal = '"'+ this.entitySearchService.currentSearchByIdParameters.recordId +'"';
        if (this.entitySearchService.currentSearchByIdParameters.dataSource) {
          retVal += ' in "'+ this.entitySearchService.currentSearchByIdParameters.dataSource +'"';
        }
      } else if(this.entitySearchService.currentSearchByIdParameters.entityId) {
        retVal = '"'+ this.entitySearchService.currentSearchByIdParameters.entityId +'"';
      }
    }
    return retVal;
  }
  public get hasCurrentlySelectedSearchResult(): boolean {
    return this.entitySearchService && 
    this.entitySearchService.currentlySelectedSearchResult && 
    this.entitySearchService.currentlySelectedSearchResult.ENTITY && 
    this.entitySearchService.currentlySelectedSearchResult.ENTITY.RESOLVED_ENTITY && 
    this.entitySearchService.currentlySelectedSearchResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID ? true : false;

  }
  public noResults: boolean = false;

  constructor(
      private configService: SzWebAppConfigService,
      public entitySearchService: EntitySearchService,
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
      if(this.entitySearchService.currentlySelectedSearchResult) {
        // do .... hmmm.. dunno.
        //this.entitySearchService.currentlySelectedSearchResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID
      }
  }

  ngOnInit() {}
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
      this.spinner.hide();
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
  }

  /**
   * Event handler for when the fields in the SzSearchComponent
   * are cleared.
   */
  public onSearchResultsCleared(searchParams: void) {
    this.noResults = false;
    // hide search results
    this.clearPreviousSearchData()
    this.entitySearchService.currentSearchByIdParameters = undefined;
    //this.router.navigate(['/search/by-id']);
  }

  private clearPreviousSearchData() {
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.entitySearchService.currentlySelectedEntityData = undefined;
    this.entitySearchService.currentRecord = undefined;
  }

  /**
   * Event handler for when the parameters of the search performed from
   * the SzSearchComponent | SzSearchByIdComponent has changed.
   * This only happens on submit button click
   */
  public onSearchParameterChange(searchParams: SzEntitySearchParams | SzSearchByIdFormParams) {
    //console.log('onSearchParameterChange: ', searchParams);
    let isByIdParams = false;
    const byIdParams = (searchParams as SzSearchByIdFormParams);
    if ( byIdParams && ((byIdParams.dataSource && byIdParams.recordId) || byIdParams.entityId)  ) {
      isByIdParams = true;
    } else {
      // console.warn('not by id: ' + isByIdParams, byIdParams);
    }
    if (!isByIdParams) {
      this.entitySearchService.currentSearchParameters = (searchParams as SzEntitySearchParams);
      this.currentSearchParameters = this.entitySearchService.currentSearchParameters;
    } else {
      this.entitySearchService.currentSearchByIdParameters = (searchParams as SzSearchByIdFormParams);
    }
  }

  public onSearchStart(evt) {
    this.noResults = false;
    this.clearPreviousSearchData();

    console.log('onSearchStart: ', evt);
    this.spinner.show();
  }
  public onSearchEnd(evt) {
    console.log('onSearchEnd: ', evt);
    this.spinner.hide();
    if(!evt) {
      // no results
      this.noResults = true;
    }
  }
  public onSearchException(evt) {
    console.log('onSearchException: ', evt);
    this.spinner.hide();
    this.noResults = true;
    this.clearPreviousSearchData();
  }
  /** when user clicks on a search result item */
  onSearchResultClick(entityId: number) {
    console.log('onSearchResultClick: ', entityId);
    this.router.navigate(['search','by-id','entitities', entityId]);
  }
  /** when user clicks the "open results in graph" button */
  onOpenInGraph($event) {
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

  /** when the value from the sz-search-by-id component changes */
  onRecordChange(evt: SzSdkEntityRecord) {
    console.log('onRecordChange: ', evt);
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentlySelectedEntityId = undefined;
    this.entitySearchService.currentlySelectedEntityData = undefined;
    this.entitySearchService.currentRecord = evt;
    //this.router.navigate(['search','by-id','datasources', this.entitySearchService.currentSearchByIdParameters.dataSource, 'records', evt.recordId ]);
  }
  /** when the by entity id result from the sz-search-by-id component changes */
  onEntityResult(entity: SzSdkResolvedEntity) {
    this.entitySearchService.currentSearchResults = undefined;
    this.entitySearchService.currentRecord = undefined;
    let inputData = entity;
    let searchTitle = this.entitySearchService.searchTitle;
    console.log('onEntityResult: '+searchTitle, inputData);
    
    this.entitySearchService.currentlySelectedEntityData = inputData;
    this.entitySearchService.currentlySelectedEntityId = entity.ENTITY_ID;

    this.titleService.setTitle(this.entitySearchService.searchTitle);// currentlySelectedEntityId
    //this.router.navigate(['search','by-id','entitities', this.entitySearchService.currentlySelectedEntityId ]);
  }

  /** handler for when the entityId of the sdkcomponent is changed.
   * eg: when a user clicks a related entity name.
  */
  public onEntityIdChanged(entityId: number): void {
    if (this.entitySearchService.currentlySelectedEntityId && this.entitySearchService.currentlySelectedEntityId !== entityId) {
      this.entitySearchService.currentlySelectedEntityId = entityId;
      // update route if needed
      this.router.navigate(['search/by-attribute/entity/' + entityId]);
    }
  }
  /** update the page title to the entity name */
  /*
  onEntityDataChanged(data: SzEntityData) {
    const titleCaseWord = (word: string) => {
      if (!word) { return word; }
      return word[0].toUpperCase() + word.substr(1).toLowerCase();
    };
    const titleCaseSentence = (words: string) => {
      if (!words) { return words; }
      return (words.split(' ').map( titleCaseWord ).join(' '));
    };
    if(data && data.resolvedEntity) {
      if(data.resolvedEntity.entityName) {
        this.titleService.setTitle( titleCaseSentence(data.resolvedEntity.entityName) + ': Details');
      }
    }
  }*/
}

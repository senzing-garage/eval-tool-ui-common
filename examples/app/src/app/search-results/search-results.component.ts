import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  SzEntitySearchParams,
  SzSdkSearchResult,
  SzSearchGrpcComponent,
  SzSearchResultsGrpcComponent,

  //SzAttributeSearchResult
} from '@senzing/sdk-components-grpc-web';
import { SpinnerService } from '../services/spinner.service';
import { EntitySearchService } from '../services/entity-search.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    SzSearchResultsGrpcComponent
  ]
})
export class SearchResultsComponent implements OnInit {
  /** the current search results */
  public currentSearchResults: SzSdkSearchResult[];
  public currentSearchParameters: SzEntitySearchParams;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService,
    private titleService: Title,
    private spinner: SpinnerService) { }

  ngOnInit() {
    this.route.data
    .subscribe((data: { results: SzSdkSearchResult[], parameters: SzEntitySearchParams }) => {
      this.currentSearchParameters = data.parameters;
      this.currentSearchResults = data.results;
      // clear out any globally stored value;
      this.search.currentlySelectedEntityId = undefined;
      // set page title
      this.titleService.setTitle( this.search.searchTitle );
    });

    // listen for global search data
    this.search.results.subscribe((results: SzSdkSearchResult[]) => {
      this.currentSearchResults = results;
      // set page title
      this.titleService.setTitle( this.search.searchTitle );
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe( (event) => {
      this.spinner.hide();
    });

  }
  /** when user clicks on a search result item */
  onSearchResultClick(param) {
    this.router.navigate(['entity/' + param.entityId]);
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

}

import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import {
  SzSearchComponent,
  SzSearchService,
  SzPrefsService,
  SzSdkHowEntityResults,
  SzSdkHowResolutionStep,
  SzSdkVirtualEntity
} from '@senzing/sdk-components-ng';
import { Overlay } from '@angular/cdk/overlay';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  //public currentlySelectedEntityId: number = 200002;
  //public currentlySelectedEntityId: number = 400124;

  //public currentlySelectedEntityId: number = 401992;
  //public currentlySelectedEntityId: number = 200003;
  public currentlySelectedEntityId: number = 200002;

  private howResult: SzSdkHowEntityResults;
  @ViewChild('howGraph') howGraph: SzSearchComponent;

  constructor(
    public searchService: SzSearchService,
    public overlay: Overlay,
    public prefs: SzPrefsService,
    public viewContainerRef: ViewContainerRef){}

  ngAfterViewInit() {
  }

  public onDataChange(data: SzSdkHowEntityResults) {
    console.log('onDataChange: ',data);
    this.howResult = data;
  }

  public get resolutionStepsByVirtualId(): SzSdkHowResolutionStep[] {
    if(this.howResult) {
      return this.howResult.RESOLUTION_STEPS;
    }
    return undefined;
  }
  public get finalCardsData(): SzSdkVirtualEntity[] {
    if(this.howResult) {
      return this.howResult.FINAL_STATE?.VIRTUAL_ENTITIES;
    }
    return undefined;
  }
}

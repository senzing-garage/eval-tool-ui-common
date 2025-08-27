import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';
import { SzLicenseInfoComponent } from '@senzing/sz-sdk-components-grpc-web';

@Component({
    selector: 'app-license',
    templateUrl: './license.component.html',
    imports: [
      CommonModule,
      SzLicenseInfoComponent
    ],
    styleUrls: ['./license.component.scss']
  })
  export class AppLicenseComponent implements OnInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();


    constructor(

    ) {

    }
    ngOnInit () {

    }
}
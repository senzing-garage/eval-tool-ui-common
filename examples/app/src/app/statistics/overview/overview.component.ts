import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute, UrlSegment } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Title } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    imports: [
      CommonModule
    ],
    styleUrls: ['./overview.component.scss']
  })
  export class AppOverViewComponent implements OnInit {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();


    constructor() {

    }
    ngOnInit () {

    }
}
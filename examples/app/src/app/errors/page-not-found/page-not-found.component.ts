import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ErrorPageComponent } from '../../common/error/error.component';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
  imports: [
    CommonModule, ErrorPageComponent
  ]
})
export class PageNotFoundComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor() { }

  ngAfterViewInit() {
    document.querySelector('body').classList.add('not-found');
  }
  ngOnDestroy() {
    document.querySelector('body').classList.remove('not-found');
  }
  ngOnInit() {
  }

}

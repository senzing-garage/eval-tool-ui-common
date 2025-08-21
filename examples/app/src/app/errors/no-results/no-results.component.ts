import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ErrorPageComponent } from '../../common/error/error.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-no-results',
  templateUrl: './no-results.component.html',
  styleUrls: ['./no-results.component.scss'],
  imports: [
    CommonModule, MatIconModule
  ]
})
export class NoResultsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ErrorPageComponent } from '../../common/error/error.component';

@Component({
  selector: 'app-error-timeout',
  templateUrl: './timeout.component.html',
  styleUrls: ['./timeout.component.scss'],
  imports: [
    CommonModule, ErrorPageComponent
  ]
})
export class GatewayTimeoutErrorComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

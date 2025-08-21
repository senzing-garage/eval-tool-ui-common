import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ErrorPageComponent } from '../../common/error/error.component';

@Component({
  selector: 'app-errors-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.scss'],
  imports: [
    CommonModule, ErrorPageComponent
  ]
})
export class ServerErrorComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

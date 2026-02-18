import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SzEntityDetailGrpcComponent } from '@senzing/eval-tool-ui-common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SzEntityDetailGrpcComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}

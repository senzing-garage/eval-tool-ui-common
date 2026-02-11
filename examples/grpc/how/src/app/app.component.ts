import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  SzHowEntityGrpcComponent,
  SzSdkHowEntityResults
} from '@senzing/eval-tool-ui-common';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SzHowEntityGrpcComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public entityId: number = 1;

  public onDataChange(data: SzSdkHowEntityResults) {
    console.log('onDataChange: ', data);
  }

  public onLoading(isLoading: boolean) {
    console.log('loading: ', isLoading);
  }
}

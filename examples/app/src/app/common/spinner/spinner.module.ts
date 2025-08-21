import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './spinner.component';
import { SpinnerService } from '../../services/spinner.service';

@NgModule({
  imports: [
    CommonModule,
    SpinnerComponent
  ],
  providers: [
    SpinnerService
  ],
  exports: [
    SpinnerComponent
  ]
})
export class SpinnerModule { }

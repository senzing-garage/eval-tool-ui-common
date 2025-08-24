import { Component, OnInit } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  imports: [CommonModule]
})
export class SpinnerComponent implements OnInit {
  public _active = true;

  public get active(): boolean {
    return this.spinner.active;
  }

  public set active(value: boolean) {
    this.spinner.active = value;
  }

  constructor(private spinner: SpinnerService) {
    this.spinner.spinnerObservable.subscribe(
      (spinnerState) => {
        this._active = spinnerState;
      }
    );
  }
  ngOnInit() { }

}

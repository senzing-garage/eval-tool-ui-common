import { Component } from '@angular/core';
import { SzProductInfoComponent } from '@senzing/eval-tool-ui-common';

@Component({
  selector: 'app-root',
  imports: [SzProductInfoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'product';
}

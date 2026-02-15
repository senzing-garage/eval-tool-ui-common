import { Routes } from '@angular/router';
import { GraphViewComponent } from './graph-view.component';

export const routes: Routes = [
  { path: 'graph/:entityId', component: GraphViewComponent },
  { path: ':entityId', component: GraphViewComponent },
  { path: '', component: GraphViewComponent }
];

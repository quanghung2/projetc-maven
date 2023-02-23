import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { RoutingPlanDialogComponent } from './routing-plan-dialog/routing-plan-dialog.component';
import { ViewRouteComponent } from './view-route.component';

const routes: Route[] = [
  {
    path: '',
    component: ViewRouteComponent,
    children: []
  }
];

@NgModule({
  declarations: [ViewRouteComponent, RoutingPlanDialogComponent],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class ViewRouteModule {}

import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { HealthCheckComponent } from './health-check.component';
import { SettingDialogComponent } from './setting-dialog/setting-dialog.component';

const routes: Route[] = [
  {
    path: '',
    component: HealthCheckComponent,
    children: []
  }
];

@NgModule({
  declarations: [HealthCheckComponent, SettingDialogComponent],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class HealthCheckModule {}

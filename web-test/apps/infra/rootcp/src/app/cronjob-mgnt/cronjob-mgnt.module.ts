import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CloneJobComponent } from './clone-job/clone-job.component';
import { CronjobMgntComponent } from './cronjob-mgnt.component';
import { DisableJobComponent } from './disable-job/disable-job.component';
import { EnableJobComponent } from './enable-job/enable-job.component';
import { StoreCronjobComponent } from './store-cronjob/store-cronjob.component';

const routes: Route[] = [
  {
    path: '',
    component: CronjobMgntComponent,
    children: []
  }
];

@NgModule({
  declarations: [
    CronjobMgntComponent,
    StoreCronjobComponent,
    CloneJobComponent,
    EnableJobComponent,
    DisableJobComponent
  ],
  imports: [RouterModule.forChild(routes), SharedModule]
})
export class CronjobMgntModule {}

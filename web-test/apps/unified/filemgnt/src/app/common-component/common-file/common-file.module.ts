import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { MatNativeDateModule } from '@matheo/datepicker/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { RouterModule, Routes } from '@angular/router';
import { ROUTE_LINK } from '../../common/constants';
import { CommonFileComponent } from './common-file.component';
import { ActionBarComponent } from '../action-bar/action-bar.component';
import { PendingJobComponent } from './pending-job/pending-job.component';
import { ViewJobDetailComponent } from './pending-job/view-job-detail/view-job-detail.component';

const routes: Routes = [
  {
    path: ROUTE_LINK.pending_jobs,
    component: PendingJobComponent
  },
  {
    path: ':name',
    component: CommonFileComponent
  }
];

@NgModule({
  declarations: [CommonFileComponent, ActionBarComponent, PendingJobComponent, ViewJobDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedAuthModule,
    SharedUiMaterialModule,
    SharedCommonModule,
    MatNativeDateModule,
    RouterModule.forChild(routes)
  ],
  exports: [ActionBarComponent]
})
export class CommonFileModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { AutoAttendantDetailComponent } from './auto-attendant-detail/auto-attendant-detail.component';
import { AutoAttendantComponent } from './auto-attendant.component';

export const routes: Routes = [
  { path: '', component: AutoAttendantComponent },
  {
    path: ':uuid',
    component: AutoAttendantDetailComponent,
    children: [
      {
        path: 'config',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedFlowModule),
        data: { hasPermissionConcept: false }
      },
      {
        path: 'blacklist',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedBlackListModule)
      },
      {
        path: 'worktime',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedWorktimeModule)
      }
    ]
  }
];

@NgModule({
  declarations: [AutoAttendantComponent, AutoAttendantDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedAuthModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    SharedUiPortalModule
  ]
})
export class AutoAttendantModule {}

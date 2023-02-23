import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IAM_GROUP_UUIDS } from '@b3networks/api/auth';
import { AUTO_ATTENDANT, SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AttendantComponent } from './attendant.component';
import { SidebarComponent } from './sidebar/sidebar.component';

const routes: Routes = [
  {
    path: '',
    component: AttendantComponent,
    children: [
      {
        path: 'config',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedFlowModule),
        data: { hasPermissionConcept: true }
      },
      {
        path: 'blacklist',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedBlackListModule)
      },
      {
        path: 'worktime',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedWorktimeModule)
      },
      {
        path: 'permission',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.PermissionModule),
        data: { groupUuid: IAM_GROUP_UUIDS.autoAttendant, groupName: AUTO_ATTENDANT }
      }
    ]
  }
];

@NgModule({
  declarations: [AttendantComponent, SidebarComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedCommonModule
  ]
})
export class AttendantModule {}

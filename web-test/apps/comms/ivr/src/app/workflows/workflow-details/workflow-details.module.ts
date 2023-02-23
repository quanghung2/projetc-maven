import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { CommsIvrSharedCoreModule } from '@b3networks/comms/ivr/shared';
import { SharedUiConfirmDialogModule } from '@b3networks/shared/ui/confirm-dialog';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { HeaderModule } from '../../header/header.module';
import { LandingPageModule } from '../../landing-page/landing-page.module';
import { WorkflowDetailsComponent } from './workflow-details.component';

const routes: Route[] = [
  {
    path: '',
    component: WorkflowDetailsComponent,
    children: [
      {
        path: 'config',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedFlowModule)
      },
      {
        path: 'blacklist',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.CommsIvrSharedBlackListModule)
      },
      {
        path: 'integration',
        loadChildren: () => import('./integration/integration.module').then(m => m.IntegrationModule)
      },
      {
        path: 'history',
        loadChildren: () => import('./history/history.module').then(m => m.HistoryModule)
      },
      {
        path: 'notification',
        loadChildren: () => import('@b3networks/comms/ivr/shared').then(m => m.MissedCallNotificationModule)
      }
    ]
  }
];

@NgModule({
  declarations: [WorkflowDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    HeaderModule,
    LandingPageModule,

    CommsIvrSharedCoreModule,

    SharedUiConfirmDialogModule,
    SharedUiMaterialModule
  ],
  providers: []
})
export class WorkflowDetailsModule {}

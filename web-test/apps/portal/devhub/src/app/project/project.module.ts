import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppName } from '@b3networks/fi/flow/shared';
import { ROUTE_LINK } from '../shared/contants';
import { ProjectComponent } from './project.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectComponent,
    children: [
      {
        path: ROUTE_LINK.overview,
        loadChildren: () => import('./project-settings/project-settings.module').then(m => m.ProjectSettingsModule)
      },
      {
        path: ROUTE_LINK.programmable_flow,
        loadChildren: () => import('@b3networks/fi/flow/feature/flow').then(m => m.FiFlowFeatureFlowModule),
        data: { appName: AppName.PROGRAMMABLE_FLOW }
      },
      {
        path: ROUTE_LINK.api_keys,
        loadChildren: () => import('./api-key-management/api-key-management.module').then(m => m.ApiKeyManagementModule)
      },
      {
        path: ROUTE_LINK.ips_whitelist,
        loadChildren: () => import('./ips-whitelist/ips-whitelist.module').then(m => m.IpsWhitelistModule)
      },
      {
        path: ROUTE_LINK.webhooks,
        loadChildren: () => import('./webhook-url/webhook-url.module').then(m => m.WebhookUrlModule)
      },
      {
        path: ROUTE_LINK.log,
        loadChildren: () => import('./log/log.module').then(m => m.LogModule)
      },
      {
        path: ROUTE_LINK.form,
        loadChildren: () => import('./form/form.module').then(m => m.FormModule)
      },
      {
        path: ROUTE_LINK.smpp,
        loadChildren: () => import('./smpp/smpp.module').then(m => m.SmppModule)
      },
      {
        path: '',
        redirectTo: ROUTE_LINK.overview,
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  declarations: [ProjectComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class ProjectModule {}

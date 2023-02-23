import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const enum DEV_LINK {
  api_keys = 'api-keys',
  webhooks = 'webhooks'
}

const routes: Routes = [
  {
    path: DEV_LINK.api_keys,
    loadChildren: () => import('./api-key-management/api-key-management.module').then(m => m.ApiKeyManagementModule)
  },
  {
    path: DEV_LINK.webhooks,
    loadChildren: () => import('./webhook-url/webhook-url.module').then(m => m.WebhookUrlModule)
  },
  { path: '', redirectTo: DEV_LINK.api_keys, pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class PortalOrgFeatureDeveloperModule {}

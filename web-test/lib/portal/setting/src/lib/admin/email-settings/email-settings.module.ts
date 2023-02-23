import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { EmailSettingsComponent } from './email-settings.component';

const routes: Route[] = [
  {
    path: '',
    component: EmailSettingsComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./agent-config/agent-config.module').then(m => m.AgentConfigModule)
      },
      {
        path: 'agent',
        loadChildren: () => import('./agent-config/agent-config.module').then(m => m.AgentConfigModule)
      },
      {
        path: 'config',
        loadChildren: () => import('./email-config/email-config.module').then(m => m.EmailConfigModule)
      }
    ]
  }
];

@NgModule({
  declarations: [EmailSettingsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedCommonModule,
    ChatSharedCoreModule,
    SharedUiPortalModule
  ]
})
export class EmailSettingsModule {}

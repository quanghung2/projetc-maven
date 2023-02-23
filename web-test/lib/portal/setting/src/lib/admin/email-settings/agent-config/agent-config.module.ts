import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedCommonModule } from '@b3networks/shared/common';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { AddAgentDialogComponent } from './add/add-agent-dialog.component';
import { AgentConfigComponent } from './agent-config.component';
import { Route, RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

const routes: Route[] = [
  {
    path: '',
    component: AgentConfigComponent
  }
];

@NgModule({
  declarations: [AgentConfigComponent, AddAgentDialogComponent],
  exports: [],
  imports: [
    CommonModule,
    SharedUiMaterialModule,
    SharedCommonModule,
    ChatSharedCoreModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class AgentConfigModule {}

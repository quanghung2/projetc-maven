import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import {
  ActiveCallComponent,
  AgentListComponent,
  CallLogComponent,
  CommsCallcenterSharedModule
} from '@b3networks/comms/callcenter/shared';
import { SharedAuthModule } from '@b3networks/shared/auth';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { FeedbackBarComponent } from './feedback/feedback-bar/feedback-bar.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { FullMessageComponent } from './feedback/full-message/full-message.component';
import { WorkspaceComponent } from './workspace/workspace.component';

const routes: Route[] = [
  {
    path: '',
    component: WorkspaceComponent,
    children: [
      { path: 'agent-list', component: AgentListComponent },
      { path: 'active-calls', component: ActiveCallComponent },
      { path: 'answered-calls', component: CallLogComponent },
      { path: 'unanswered-calls', component: CallLogComponent },
      { path: 'feedback', component: FeedbackComponent }
    ]
  }
];
@NgModule({
  declarations: [WorkspaceComponent, FeedbackComponent, FeedbackBarComponent, FullMessageComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedUiMaterialModule,
    SharedCommonModule,
    SharedAuthModule,
    CommsCallcenterSharedModule
  ]
})
export class CommsCallcenterFeatureWorkspaceModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedCommonModule } from '@b3networks/shared/common';
import { Route, RouterModule } from '@angular/router';
import { EmailConfigurationComponent } from './email-config.component';
import { SignaturesComponent } from './signatures/signatures.component';
import { ResponsesComponent } from './responses/responses.component';
import { InboxesComponent } from './inboxes/inboxes.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { TeamRulesComponent } from './team-rules/team-rules.component';
import { TeamTagsComponent } from './team-tags/team-tags.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { SignatureDetailDialogComponent } from './signatures/signature-detail-dialog/signature-detail-dialog.component';
import { ResponseDetailDialogComponent } from './responses/response-detail-dialog/response-detail-dialog.component';
import { InboxDetailDialogComponent } from './inboxes/inbox-detail-dialog/inbox-detail-dialog.component';
import { TagDetailDialogComponent } from './team-tags/tag-detail-dialog/tag-detail-dialog.component';
import { RuleDetailDialogComponent } from './team-rules/rule-detail-dialog/rule-detail-dialog.component';
import { WorkTimeComponent } from './team-rules/worktime/work-time.component';

const routes: Route[] = [
  {
    path: '',
    component: EmailConfigurationComponent,
    children: [
      {
        path: '',
        component: SignaturesComponent
      },
      {
        path: 'signatures',
        component: SignaturesComponent
      },
      {
        path: 'responses',
        component: ResponsesComponent
      },
      {
        path: 'inboxes',
        component: InboxesComponent
      },
      {
        path: 'notifications',
        component: NotificationsComponent
      },
      {
        path: 'team-rules',
        component: TeamRulesComponent
      },
      {
        path: 'team-tags',
        component: TeamTagsComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    EmailConfigurationComponent,
    SignaturesComponent,
    SignatureDetailDialogComponent,
    ResponsesComponent,
    ResponseDetailDialogComponent,
    InboxesComponent,
    InboxDetailDialogComponent,
    NotificationsComponent,
    TeamRulesComponent,
    RuleDetailDialogComponent,
    TeamTagsComponent,
    TagDetailDialogComponent,
    WorkTimeComponent
  ],
  imports: [
    CommonModule,
    SharedUiMaterialModule,
    SharedCommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    QuillModule.forRoot()
  ]
})
export class EmailConfigModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { EmailSharedModule } from '../shared/email-shared.module';
import { AssignedComponent } from './assigned/assigned.component';
import { DraftComponent } from './draft/draft.component';
import { FollowingComponent } from './followed/following.component';
import { SentComponent } from './sent/sent.component';

const routes: Route[] = [
  {
    path: 'assigned-to-me',
    component: AssignedComponent
  },
  {
    path: 'following',
    component: FollowingComponent
  },
  {
    path: 'draft',
    component: DraftComponent
  },
  {
    path: 'sent',
    component: SentComponent
  }
];

@NgModule({
  declarations: [AssignedComponent, DraftComponent, SentComponent, FollowingComponent],
  imports: [
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    ClipboardModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    EmailSharedModule,
    ChatSharedCoreModule
  ]
})
export class PersonalModule {}

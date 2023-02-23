import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmailSharedModule } from '../shared/email-shared.module';
import { ArchivedComponent } from './archive/archive.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { SnoozeComponent } from './snooze/snooze.component';
import { TeamInboxComponent } from './team-inbox/team-inbox.component';

const routes: Route[] = [
  {
    path: 'snooze',
    component: SnoozeComponent
  },
  {
    path: 'schedule',
    component: ScheduleComponent
  },
  {
    path: 'archived',
    component: ArchivedComponent
  },
  {
    path: 'team-inbox/:id',
    component: TeamInboxComponent
  }
];

@NgModule({
  declarations: [ArchivedComponent, ScheduleComponent, SnoozeComponent, TeamInboxComponent],
  imports: [
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    ClipboardModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    EmailSharedModule,
    NgxSkeletonLoaderModule,
    ChatSharedCoreModule
  ]
})
export class TeamModule {}

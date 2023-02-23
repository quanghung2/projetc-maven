import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { EmailSharedModule } from '@b3networks/chat/shared/email';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { AppStatusComponent } from './app-status/app-status.component';
import { KeyDownHandlerDirective } from './app-status/quick-search-channel/keydown-handler.directive';
import { QuickSearchChannelComponent } from './app-status/quick-search-channel/quick-search-channel.component';
import { EmailComponent } from './email/email.component';
import { EmailPersonalComponent } from './email/personal/personal.component';
import { EmailTeamComponent } from './email/team/team.component';
import { EmailTeammateComponent } from './email/teammate/teammate.component';
import { HyperspaceChannelComponent } from './hyperspace/hyperspace-channel/hyperspace-channel.component';
import { HyperspaceQuickSearchComponent } from './hyperspace/hyperspace-quick-search/hyperspace-quick-search.component';
import { HyperspaceComponent } from './hyperspace/hyperspace.component';
import { SidebarComponent } from './sidebar.component';
import { TeamInboxComponent } from './team-inbox/team-inbox.component';
import { ChannelComponent } from './teamchat/channel/channel.component';
import { InboxComponent } from './teamchat/inbox/inbox.component';
import { StarredConvosComponent } from './teamchat/starred-convos/starred-convos.component';
import { TeamComponent } from './teamchat/team/team.component';
import { TeamchatComponent } from './teamchat/teamchat.component';

@NgModule({
  declarations: [
    SidebarComponent,
    TeamchatComponent,
    AppStatusComponent,
    StarredConvosComponent,
    TeamComponent,
    ChannelComponent,
    SidebarComponent,
    EmailComponent,
    EmailPersonalComponent,
    EmailTeammateComponent,
    EmailTeamComponent,
    TeamchatComponent,
    HyperspaceComponent,
    HyperspaceChannelComponent,
    HyperspaceQuickSearchComponent,
    QuickSearchChannelComponent,
    KeyDownHandlerDirective,
    InboxComponent,
    TeamInboxComponent
  ],
  exports: [AppStatusComponent, SidebarComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,

    SharedUiMaterialModule,
    SharedCommonModule,
    CommsCallcenterSharedModule,
    SharedUiToastModule,
    ChatSharedCoreModule,
    EmailSharedModule,
    ChatSharedCoreModule
  ]
})
export class ChatSharedSidebarModule {}

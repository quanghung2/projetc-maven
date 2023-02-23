import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { UiScrollModule } from 'ngx-ui-scroll';
import { ConversationContentComponent } from './conversation-content/conversation-content.component';
import { ConversationDetailsComponent } from './conversation-details/conversation-details.component';
import { ConversationInfoComponent } from './conversation-details/conversation-info/conversation-info.component';
import { ConversationMembersComponent } from './conversation-details/conversation-members/conversation-members.component';
import { ConversationStorageSharedFilesComponent } from './conversation-details/conversation-storage-shared-files/conversation-storage-shared-files.component';
import { ConversationThumbnailFileComponent } from './conversation-details/conversation-storage-shared-files/conversation-thumbnail-file/conversation-thumbnail-file.component';
import { ConversationFooterComponent } from './conversation-footer/conversation-footer.component';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { ConversationComponent } from './conversation.component';

const routes: Route[] = [
  {
    path: '',
    component: ConversationComponent,
    children: [
      {
        path: ':id',
        component: ConversationContentComponent
      },
      { path: ':id/messages/:messageId', component: ConversationContentComponent }
    ]
  }
];

@NgModule({
  declarations: [
    ConversationComponent,
    ConversationHeaderComponent,
    ConversationContentComponent,
    ConversationFooterComponent,
    ConversationDetailsComponent,
    ConversationInfoComponent,
    ConversationMembersComponent,
    ConversationStorageSharedFilesComponent,
    ConversationThumbnailFileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),

    SharedCommonModule,
    SharedUiToastModule,

    ChatSharedCoreModule,

    SharedUiMaterialModule,
    SharedUiPortalModule,
    InfiniteScrollModule,
    UiScrollModule
  ]
})
export class ChatSharedTeamchatModule {}

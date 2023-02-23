import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { QuillModule } from 'ngx-quill';
import { UiScrollModule } from 'ngx-ui-scroll';
import { AddPrivateNoteComponent } from './conversation-details/private-note/add-private-note/add-private-note.component';
import { PrivateNoteComponent } from './conversation-details/private-note/private-note.component';
import { ConversationContentComponent } from './conversation/conversation-content/conversation-content.component';
import { ConversationFooterComponent } from './conversation/conversation-footer/conversation-footer.component';
import { ConversationHeaderComponent } from './conversation/conversation-header/conversation-header.component';
import { ConversationComponent } from './conversation/conversation.component';

const PUBLIC_COMPONENT = [
  ConversationComponent,
  ConversationHeaderComponent,
  ConversationFooterComponent,
  ConversationContentComponent,
  AddPrivateNoteComponent,
  PrivateNoteComponent
];

@NgModule({
  declarations: [PUBLIC_COMPONENT],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    ChatSharedCoreModule,

    SharedUiMaterialModule,
    SharedCommonModule,
    SharedUiToastModule,

    UiScrollModule,
    InfiniteScrollModule,
    QuillModule
  ],
  exports: [PUBLIC_COMPONENT]
})
export class ChatSharedLivechatModule {}

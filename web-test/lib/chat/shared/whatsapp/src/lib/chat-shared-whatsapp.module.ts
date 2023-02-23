import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { QuillModule } from 'ngx-quill';
import { UiScrollModule } from 'ngx-ui-scroll';
import { ConversationContentComponent } from './conversation/conversation-content/conversation-content.component';
import { ConversationFooterComponent } from './conversation/conversation-footer/conversation-footer.component';
import { ConversationHeaderComponent } from './conversation/conversation-header/conversation-header.component';
import { ConversationComponent } from './conversation/conversation.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    QuillModule,

    ChatSharedCoreModule,
    SharedCommonModule,

    SharedUiMaterialModule,
    SharedUiToastModule,
    UiScrollModule,
    ReactiveFormsModule
  ],
  declarations: [
    ConversationComponent,
    ConversationFooterComponent,
    ConversationContentComponent,
    ConversationHeaderComponent
  ],
  exports: [
    ConversationComponent,
    ConversationHeaderComponent,
    ConversationContentComponent,
    ConversationFooterComponent
  ]
})
export class ChatSharedWhatsappModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { ConversationComponent } from './conversation/conversation.component';
import { MessageComponent } from './message/message.component';

@NgModule({
  imports: [CommonModule, CommonModule, FormsModule, SharedCommonModule, SharedUiMaterialModule, SharedUiToastModule],
  declarations: [ConversationComponent, MessageComponent],
  exports: [ConversationComponent]
})
export class ChatSharedVoiceModule {}

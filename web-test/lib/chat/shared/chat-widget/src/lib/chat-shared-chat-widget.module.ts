import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { MessageComponent } from './message/message.component';
import { UploadDialogComponent } from './upload-dialog/upload-dialog.component';

const PUBLIC_COMPONENT = [UploadDialogComponent, MessageComponent];

@NgModule({
  declarations: [PUBLIC_COMPONENT],
  imports: [CommonModule, SharedCommonModule, SharedUiMaterialModule, ChatSharedCoreModule],
  exports: [PUBLIC_COMPONENT]
})
export class ChatSharedChatWidgetModule {}

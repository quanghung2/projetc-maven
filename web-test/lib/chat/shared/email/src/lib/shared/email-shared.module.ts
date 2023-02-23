import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatSharedCoreModule } from '@b3networks/chat/shared/core';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { AngularSplitModule } from 'angular-split';
import { ClipboardModule } from 'ngx-clipboard';
import { QuillModule } from 'ngx-quill';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AssignMultipleMemberDialog } from './assign-multiple-member/assign-multiple-member.component';
import { ConversationFooterComponent } from './conversation-footer/conversation-footer.component';
import { EmailConversationComponent } from './conversation/email-conversation.component';
import { ArchiveConversationComponent } from './dialog/archive-conversation/archive-conversation.component';
import { AssignMemberDialog } from './dialog/assign-member/assign-member.component';
import { CreateInboxDialogComponent } from './dialog/create-inbox/create-inbox.component';
import { CreateTagComponent } from './dialog/create-tag/create-tag.component';
import { MoveEmailToInboxDialog } from './dialog/move-email/move-email-inbox.component';
import { ScheduleEmailComponent } from './dialog/schedule-email/schedule-email.component';
import { SendEmailWaitingDlg } from './dialog/send-email-waiting/send-email-waiting.component';
import { EmailAddressComponent } from './email-address/email-address.component';
import { EmailConversationDetailComponent } from './email-conversation-detail/email-conversation-detail.component';
import { EmailSenderAddressComponent } from './email-sender-address/email-sender-address.component';
import { EmailTimeAgoComponent } from './email-timeago/email-timeago.component';
import { EmailConversationListComponent } from './list/email-conversation-list.component';
import { MemberBoxComponent } from './member-box/member-box.component';
import { EmailMessageComponent } from './message/message.component';
import { RecipientComponent } from './recipient/recipient.component';
import { DateRangeComponent } from './search-criteria/date-range.component';

const COMPONENTS = [
  AssignMultipleMemberDialog,
  MemberBoxComponent,
  EmailMessageComponent,
  EmailConversationComponent,
  EmailConversationDetailComponent,
  EmailTimeAgoComponent,
  MoveEmailToInboxDialog,
  SendEmailWaitingDlg,
  AssignMemberDialog,
  ConversationFooterComponent,
  ScheduleEmailComponent,
  ArchiveConversationComponent,
  EmailConversationListComponent,
  EmailAddressComponent,
  EmailSenderAddressComponent,
  CreateTagComponent,
  CreateInboxDialogComponent,
  DateRangeComponent,
  RecipientComponent
];

@NgModule({
  declarations: [COMPONENTS],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    ClipboardModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    AngularSplitModule.forRoot(),
    NgxSkeletonLoaderModule.forRoot(),
    QuillModule.forRoot(),
    ChatSharedCoreModule
  ],
  exports: [COMPONENTS]
})
export class EmailSharedModule {}

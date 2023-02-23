import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommsSharedModule } from '@b3networks/comms/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { SharedUiPortalModule } from '@b3networks/shared/ui/portal';
import { SharedUiToastModule } from '@b3networks/shared/ui/toast';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { QuillModule } from 'ngx-quill';
import { UiScrollModule } from 'ngx-ui-scroll';
import { AgentAvatarComponent } from './components/agent-avatar/agent-avatar.component';
import { ArchiveConvoComponent } from './components/archive-convo/archive-convo.component';
import { AttachmentMessageComponent } from './components/chat-message/attachment-message/attachment-message.component';
import { AudioFileMessageComponent } from './components/chat-message/audio-file-message/audio-file-message.component';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { DeleteMessageComponent } from './components/chat-message/delete-message/delete-message.component';
import { InteractiveButtonComponent } from './components/chat-message/interactive-message/interactive-button/interactive-button.component';
import { InteractiveDetailComponent } from './components/chat-message/interactive-message/interactive-detail/interactive-detail.component';
import { InteractiveInputComponent } from './components/chat-message/interactive-message/interactive-input/interactive-input.component';
import { InteractiveUploadComponent } from './components/chat-message/interactive-message/interactive-input/interactive-upload/interactive-upload.component';
import { InteractiveLoopComponent } from './components/chat-message/interactive-message/interactive-loop/interactive-loop.component';
import { InteractiveMessageComponent } from './components/chat-message/interactive-message/interactive-message.component';
import { InteractiveTextComponent } from './components/chat-message/interactive-message/interactive-text/interactive-text.component';
import { NormalMessageComponent } from './components/chat-message/normal-message/normal-message.component';
import { PreChatSurveyMessageComponent } from './components/chat-message/pre-chat-survey-message/pre-chat-survey-message.component';
import { ReplyMessageComponent } from './components/chat-message/reply-message/reply-message.component';
import { SummaryMessageComponent } from './components/chat-message/summary-message/summary-messagecomponent';
import { VideoFileMessageComponent } from './components/chat-message/video-file-message/video-file-message.component';
import { WebhookMessageComponent } from './components/chat-message/webhook-message/webhook-message.component';
import { ConferenceRoomComponent } from './components/conference-room/conference-room.component';
import { ConfirmInviteHyperspaceComponent } from './components/confirm-invite-hyperspace/confirm-invite-hyperspace.component';
import { ContactRecordComponent } from './components/contact-record/contact-record.component';
import { ConversationContentVirtualScrollComponent } from './components/conversation-content-virtual-scroll/conversation-content-virtual-scroll.component';
import { ConvoNameComponent } from './components/convo-name/convo-name.component';
import { CreateChannelHyperComponent } from './components/create-channel-hyper/create-channel-hyper.component';
import { CreateConvoComponent } from './components/create-convo/create-convo.component';
import { ConfirmInviteComponent } from './components/dialog/confirm-invite/confirm-invite.component';
import { CreateSmsComponent } from './components/dialog/create-sms/create-sms.component';
import { InteractiveDialogComponent } from './components/dialog/interactive-dialog/interactive-dialog.component';
import { PreviewHistoryComponent } from './components/dialog/search-dialog/preview-history/preview-history.component';
import { SearchDialogComponent } from './components/dialog/search-dialog/search-dialog.component';
import { SelectContactComponent } from './components/dialog/select-contact/select-contact.component';
import { StoreContactComponent } from './components/dialog/store-contact/store-contact.component';
import { EditDescriptionComponent } from './components/edit-description/edit-description.component';
import { EmailMenuItemComponent } from './components/email-menu-item/email-menu-item.component';
import { InviteMemberCaseComponent } from './components/invite-member-case/invite-member-case.component';
import { InviteMemberHyperComponent } from './components/invite-member-hyper/invite-member-hyper.component';
import { InviteMemberComponent } from './components/invite-member/invite-member.component';
import { KeypadComponent } from './components/keypad/keypad.component';
import { PhoneNumberDirective } from './components/keypad/phone-num-pattern.directive';
import { LeaveConvoComponent } from './components/leave-convo/leave-convo.component';
import { ManagePhoneDialogComponent } from './components/manage-phone-dialog/manage-phone-dialog.component';
import { MenuToggleComponent } from './components/menu-toggle/menu-toggle.component';
import { PhoneDialogComponent } from './components/phone-dialog/phone-dialog.component';
import { PhoneKeypadComponent } from './components/phone-keypad/phone-keypad.component';
import { ConfirmDisableNotifyComponent } from './components/quill-editor/confirm-disable-notify/confirm-disable-notify.component';
import { CshQuillEditorComponent } from './components/quill-editor/quill-editor.component';
import { RemoveMemberComponent } from './components/remove-member/remove-member.component';
import { RenameConversationComponent } from './components/rename-conversation/rename-conversation.component';
import { RenderMemberMenuComponent } from './components/render-member-menu/render-member-menu.component';
import { RenderMemberComponent } from './components/render-member/render-member.component';
import {
  RightSidebarAction,
  RightSidebarActions,
  RightSidebarComponent,
  RightSidebarContent,
  RightSidebarExtend,
  RightSidebarHeader,
  RightSidebarInfo,
  RightSidebarPrimary,
  RightSidebarSubTitle,
  RightSidebarTitle
} from './components/right-sidebar/right-sidebar.component';
import { UploadDialogV2Component } from './components/upload-dialog-v2/upload-dialog-v2.component';
import { UploadDialogComponent } from './components/upload-dialog/upload-dialog.component';
import { WhatsappCannedResponseComponent } from './components/whatsapp-canned-response/whatsapp-canned-response.component';
import { WhatsappTemplate } from './components/whatsapp-template/whatsapp-template.component';
import { IntersectionObserverDomDirective } from './core/directive/intersection-observer-dom.directive';
import { LazyLoadUnknownDirective } from './core/directive/lazy-load-unknown.directive';
import { GetRoleChannelHyperPipe } from './core/pipe/get-role-channel-hyper.pipe';
import { GetRolePipe } from './core/pipe/get-role.pipe';
import { GetThumbnailsPipe } from './core/pipe/get-thumbnails.pipe';
import { SelectContactPipe } from './core/pipe/select-contact.pipe';
import { SelectExtensionPipe } from './core/pipe/select-ext.pipe';
import { SelectUserPipe } from './core/pipe/select-user.pipe';
import { StarConvoPipe } from './core/pipe/star-convo.pipe';
import { TransferDatePipe } from './core/pipe/transfer-date.pipe';
import { UserHyperTypingPipe } from './core/pipe/user-hyper-typing.pipe';
import { UserTypingPipe } from './core/pipe/user-typing.pipe';

const PRIVATE_COMPONENTS = [
  NormalMessageComponent,
  WebhookMessageComponent,
  PreChatSurveyMessageComponent,
  SummaryMessageComponent,
  IntersectionObserverDomDirective,
  InteractiveMessageComponent,
  InteractiveButtonComponent,
  InteractiveInputComponent,
  InteractiveTextComponent,
  InteractiveLoopComponent,
  InteractiveDetailComponent,
  InteractiveUploadComponent
];

const PUBLIC_COMPONENTS = [
  AttachmentMessageComponent,
  KeypadComponent,
  RightSidebarComponent,
  RightSidebarHeader,
  RightSidebarContent,

  UploadDialogComponent,
  UploadDialogV2Component,
  ArchiveConvoComponent,
  InviteMemberComponent,
  InviteMemberCaseComponent,
  LeaveConvoComponent,
  EditDescriptionComponent,
  RemoveMemberComponent,

  ChatMessageComponent,
  DeleteMessageComponent,
  RenderMemberComponent,
  RenderMemberMenuComponent,
  ConvoNameComponent,
  ConfirmInviteComponent,
  WhatsappTemplate,
  WhatsappCannedResponseComponent,
  RenameConversationComponent,

  SearchDialogComponent,
  PreviewHistoryComponent,

  StoreContactComponent,
  SelectContactComponent,
  CreateSmsComponent,

  CshQuillEditorComponent,
  ConversationContentVirtualScrollComponent,

  EmailMenuItemComponent,
  AgentAvatarComponent,
  VideoFileMessageComponent,
  AudioFileMessageComponent,
  ConfirmDisableNotifyComponent,

  ContactRecordComponent,
  PhoneDialogComponent,
  PhoneKeypadComponent,
  ConferenceRoomComponent,
  ManagePhoneDialogComponent,
  CreateChannelHyperComponent,
  InviteMemberHyperComponent,
  ConfirmInviteHyperspaceComponent,
  CreateConvoComponent,
  MenuToggleComponent,
  InteractiveDialogComponent,
  ReplyMessageComponent
];

const DIRECTIVES = [
  RightSidebarTitle,
  RightSidebarSubTitle,
  RightSidebarAction,
  RightSidebarInfo,
  RightSidebarActions,
  RightSidebarPrimary,
  RightSidebarExtend,
  PhoneNumberDirective,
  LazyLoadUnknownDirective
];

const PIPES = [
  GetThumbnailsPipe,
  StarConvoPipe,
  GetRolePipe,
  SelectUserPipe,
  UserTypingPipe,
  GetRoleChannelHyperPipe,
  UserHyperTypingPipe,
  TransferDatePipe,
  SelectExtensionPipe,
  SelectContactPipe
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    QuillModule,
    SharedCommonModule,
    SharedUiMaterialModule,
    UiScrollModule,
    InfiniteScrollModule,
    CommsSharedModule,
    RouterModule,
    SharedUiPortalModule,

    SharedUiToastModule,
    FlexLayoutModule
  ],
  declarations: [PRIVATE_COMPONENTS, PUBLIC_COMPONENTS, DIRECTIVES, PIPES],
  exports: [PUBLIC_COMPONENTS, DIRECTIVES, PIPES]
})
export class ChatSharedCoreModule {}

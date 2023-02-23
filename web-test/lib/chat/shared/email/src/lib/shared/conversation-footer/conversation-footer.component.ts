import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupUI,
  HistoryMessageQuery,
  JoinLeaveFollowedData,
  Member,
  MeQuery,
  MessageBody,
  MsgType,
  RoleType,
  SystemMessageData,
  SystemMsgType,
  TimeService,
  User,
  UserQuery,
  ViewUIStateCommon
} from '@b3networks/api/workspace';
import { MessageConstants, OutputContentQuill, QuillEditorInput } from '@b3networks/chat/shared/core';
import { deltaHasContent } from '@b3networks/shared/common';
import { DeltaStatic } from 'quill';

@Component({
  selector: 'b3n-email-conversation-footer',
  templateUrl: './conversation-footer.component.html',
  styleUrls: ['./conversation-footer.component.scss']
})
export class ConversationFooterComponent implements OnInit, OnChanges {
  private _id: string;

  convoName: string;

  quillEditorData: QuillEditorInput = <QuillEditorInput>{
    enableMention: true,
    enableEmoji: true,
    enableUpload: true,
    showSendButton: false
  };

  @Input() conversationGroup: ConversationGroup;
  @Output() uploadedFiles = new EventEmitter<File[]>();

  constructor(
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private chatService: ChatService,
    private messageQuery: HistoryMessageQuery,
    private timeService: TimeService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this._id !== this.conversationGroup.conversationGroupId) {
      let placeholder: string;
      if (this.conversationGroup.description && this.conversationGroup.description.length > 50) {
        placeholder = this.conversationGroup.description.slice(0, 50) + '...';
      } else {
        placeholder = this.conversationGroup.description;
      }
      this._id = this.conversationGroup.conversationGroupId;
      const context = this.convoGroupQuery.getConvoUiState(this._id)?.draftMsg;
      this.quillEditorData = {
        ...this.quillEditorData,
        context,
        placeholder: `Message to ${placeholder}`
      };
    }
  }

  handleEnterMessage(data: OutputContentQuill) {
    const me = this.meQuery.getMe();
    const message = ChatMessage.createEmailMessage(
      this.conversationGroup,
      new MessageBody({ text: data?.msg }),
      me.userUuid,
      MsgType.message
    );

    this.chatService.send(message);

    if (data.mentions && data.mentions.length) {
      data.mentions.forEach((userUUid: string) => {
        const user = this.userQuery.getUserByChatUuid(userUUid);
        this.follow(user);
      });
    }
  }

  handleEditLastMessage($event) {
    const me = this.meQuery.getMe();
    const lastestMessage = this.messageQuery.getlastestMsgByUser(
      this.conversationGroup.publicConversationId,
      me.userUuid
    )[0];
    if (lastestMessage && this.timeService.nowInMillis() - lastestMessage.ts < MessageConstants.TIMEOUT) {
      this.convoGroupService.updateConvoViewState(this.conversationGroup.id, <ConversationGroupUI>{
        editingMessageId: lastestMessage.clientId
      });
    }
  }

  onUploadFile(files: File[]) {
    this.uploadedFiles.emit(files);
  }

  onTextChanged(draftMessage: DeltaStatic) {
    const text = deltaHasContent(draftMessage) ? draftMessage : null;
    this.convoGroupService.updateConvoViewState(this._id, <ViewUIStateCommon>{
      draftMsg: text
    });
  }

  follow(user: User) {
    const member: Partial<Member> = {
      role: RoleType.followed,
      identityUuid: user.identityUuid
    };

    this.convoGroupService.addMembers(this.conversationGroup.id, [member]).subscribe(() => {
      const messageBody: MessageBody = new MessageBody({
        data: <SystemMessageData>{
          text: MessageConstants.FOLLOWED_EMAIL_CONVERSATION(user.displayName),
          type: SystemMsgType.followed,
          data: new JoinLeaveFollowedData({
            followed: [user.userUuid]
          })
        }
      });
      this.sendMessage(messageBody, user.userUuid);
    });
  }

  private sendMessage(messageBody: MessageBody, userUuid: string, isNoStore = false) {
    const message = ChatMessage.createEmailMessage(
      this.conversationGroup,
      new MessageBody(messageBody),
      userUuid,
      MsgType.system,
      isNoStore
    );

    this.chatService.send(message);
  }
}

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {} from '@b3networks/api/callcenter';
import { ContactQuery, ContactService, ContactUI } from '@b3networks/api/contact';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupUI,
  MeQuery,
  MessageBody,
  MsgType,
  ViewUIStateCommon
} from '@b3networks/api/workspace';
import {
  AssignLeftReq,
  InviteMemberCaseComponent,
  OutputContentQuill,
  QuillEditorInput,
  Txn,
  TxnService,
  UNKNOWN_USER
} from '@b3networks/chat/shared/core';
import { deltaHasContent } from '@b3networks/shared/common';
import { DeltaStatic } from 'quill';

@Component({
  selector: 'csl-conversation-footer',
  templateUrl: './conversation-footer.component.html',
  styleUrls: ['./conversation-footer.component.scss']
})
export class ConversationFooterComponent implements OnInit, OnChanges {
  private _id: string;

  quillEditorData: QuillEditorInput = <QuillEditorInput>{
    enableMention: false,
    enableEmoji: false,
    enableUpload: true,
    showSendButton: true
  };

  convoName: string;
  isMemberTxn: boolean;

  @Input() ticket: ConversationGroup;
  @Input() txn: Txn;
  @Input() isMergeTxnContact: boolean;
  @Output() uploadedFiles = new EventEmitter<File[]>();

  constructor(
    private meQuery: MeQuery,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private dialog: MatDialog,
    private chatService: ChatService,
    private txnService: TxnService,
    private contactQuery: ContactQuery,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket'] && this._id !== this.ticket.conversationGroupId) {
      this._id = this.ticket.conversationGroupId;

      const context = this.convoGroupQuery.getConvoUiState(this._id)?.draftMsg;
      this.quillEditorData = { ...this.quillEditorData, context, placeholder: this.getTicketPlaceholder(this.ticket) };
    }
    if (changes['txn']) {
      this.isMemberTxn = this.txn?.lastAssignedAgents?.findIndex(x => x === this.meQuery.getMe()?.identityUuid) > -1;
    }
  }

  handleEnterMessage(data: OutputContentQuill) {
    const me = this.meQuery.getMe();
    const message = ChatMessage.createMessage(
      this.ticket,
      new MessageBody({ text: data?.msg }),
      me.userUuid,
      MsgType.message
    );
    const sent = this.chatService.send(message);
    if (sent) {
      if (!this.isMergeTxnContact) {
        // conversation
        const uiState = this.convoGroupQuery.getConvoUiState(this._id);
        if (uiState.lastSeenMsgID) {
          // scroll bottom
          this.convoGroupService.updateConvoViewState(this._id, <ConversationGroupUI>{
            lastSeenMsgID: undefined,
            viewingOlderMessage: undefined
          });
        }
      } else {
        // contact
        const uiState = this.contactQuery.getUiState(this.txn.customerUuid);
        if (uiState.lastSeenMsgID) {
          // scroll bottom
          this.contactService.updateUIViewState(this.txn.customerUuid, <ContactUI>{
            lastSeenMsgID: undefined,
            viewingOlderMessage: undefined
          });
        }
      }
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

  handleEditLastMessage(ediable: boolean) {
    // now, livechat cannot edit message
    return;
  }

  joinCaseWhatsapp() {
    this.dialog.open(InviteMemberCaseComponent, {
      width: '600px',
      data: { convo: this.ticket, txn: this.txn }
    });
  }

  assignToMe() {
    const me = this.meQuery.getMe();
    if (this.txn?.inboxUuid) {
      this.txnService.joinTxnV2(this.txn.txnUuid, me.identityUuid).subscribe();
    } else {
      const req = <AssignLeftReq>{
        agentUuid: me.identityUuid,
        txnUuid: this.ticket.conversationGroupId
      };
      this.txnService.assign(req).subscribe();
    }
  }

  private getTicketPlaceholder(convo: ConversationGroup) {
    this.convoName = convo.customerInfo?.name || UNKNOWN_USER;
    return `Message to ${this.convoName}`;
  }
}

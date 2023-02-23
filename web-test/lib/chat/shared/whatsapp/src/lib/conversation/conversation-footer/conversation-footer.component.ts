import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {} from '@b3networks/api/callcenter';
import { ContactQuery, ContactService, ContactUI } from '@b3networks/api/contact';
import {
  CannedResponse,
  CannedResponseQuery,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationGroupUI,
  HistoryMessageService,
  MeQuery,
  SendWhatsAppRequest,
  Template,
  TemplateMessageQuery,
  User,
  UserQuery,
  ViewUIStateCommon,
  WhatsAppMessage
} from '@b3networks/api/workspace';
import {
  AssignLeftReq,
  InviteMemberCaseComponent,
  OutputContentQuill,
  QuillEditorInput,
  TimeConst,
  Txn,
  TxnQuery,
  TxnService,
  UNKNOWN_USER,
  WhatsappCannedResponseComponent,
  WhatsappTemplate
} from '@b3networks/chat/shared/core';
import { deltaHasContent } from '@b3networks/shared/common';
import { DeltaStatic } from 'quill';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'csw-conversation-footer',
  templateUrl: './conversation-footer.component.html',
  styleUrls: ['./conversation-footer.component.scss']
})
export class ConversationFooterComponent implements OnInit, OnChanges {
  private _id: string;

  convoName: string;

  quillEditorData: QuillEditorInput = <QuillEditorInput>{
    enableMention: false,
    enableEmoji: false,
    enableUpload: true,
    showSendButton: false
  };

  validWhatsApp$: Observable<boolean>;
  isMemberTxn: boolean;
  cannedResponsesWhatsapp$: Observable<CannedResponse[]>;
  templates$: Observable<Template[]>;
  archivedBy$: Observable<User>;

  @Input() ticket: ConversationGroup;
  @Input() txn: Txn;
  @Input() isMergeTxnContact: boolean;
  @Output() uploadedFiles = new EventEmitter<File[]>();

  constructor(
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private messageService: HistoryMessageService,
    private dialog: MatDialog,
    private cannedResponseQuery: CannedResponseQuery,
    private templateMessageQuery: TemplateMessageQuery,
    private txnService: TxnService,
    private txnQuery: TxnQuery,
    private contactQuery: ContactQuery,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.cannedResponsesWhatsapp$ = this.cannedResponseQuery.cannedResponsesWhatsapp$;
    this.templates$ = this.templateMessageQuery.templates$;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket'] && this._id !== this.ticket.conversationGroupId) {
      this._id = this.ticket.conversationGroupId;

      this.validWhatsApp$ = this.convoGroupQuery
        .selectPropertyChannel(this.ticket.conversationGroupId, 'whatsappLastReceivedDate')
        .pipe(map(time => this.checkWhatsAppValid(time)));

      const context = this.convoGroupQuery.getConvoUiState(this._id)?.draftMsg;
      this.quillEditorData = { ...this.quillEditorData, context, placeholder: this.getTicketPlaceholder(this.ticket) };

      this.archivedBy$ = this.convoGroupQuery.selectPropertyChannel(this._id, 'archivedBy').pipe(
        filter(x => x != null),
        map(archivedBy => this.userQuery.getUserByChatUuid(archivedBy))
      );
    }
    if (changes['txn']) {
      this.isMemberTxn = this.txn?.lastAssignedAgents?.findIndex(x => x === this.meQuery.getMe()?.identityUuid) > -1;
    }
  }

  handleEnterMessage(data: OutputContentQuill) {
    const waMessage = new WhatsAppMessage();
    waMessage.text = data?.msg;
    const waReq = new SendWhatsAppRequest();
    waReq.convoUuid = this.ticket.conversationGroupId;
    waReq.clientTs = new Date().valueOf();
    waReq.message = waMessage;
    this.messageService.sendWhatsAppV2(waReq).subscribe(_ => {
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
    });
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
    // now, whatsapp cannot edit message
    return;
  }

  template() {
    this.dialog.open(WhatsappTemplate, {
      width: '600px',
      data: this.ticket
    });
  }

  chooseResponse(item: CannedResponse) {
    this.dialog.open(WhatsappCannedResponseComponent, {
      width: '600px',
      data: { convo: this.ticket, cannedResponse: item }
    });
  }

  joinCaseWhatsapp() {
    this.dialog.open(InviteMemberCaseComponent, {
      width: '600px',
      data: { convo: this.ticket, txn: this.txn }
    });
  }

  assignToMe() {
    const me = this.meQuery.getMe();
    const req = <AssignLeftReq>{
      agentUuid: me.identityUuid,
      txnUuid: this.ticket.conversationGroupId
    };
    this.txnService.assign(req).subscribe(_ => {
      // TODO:remove
      const members = this.txnQuery.getEntity(this.ticket.conversationGroupId)?.lastAssignedAgents || [];
      const isMember = members.findIndex(x => x === me.identityUuid) > -1;
      const temp = [...members];
      if (!isMember) {
        temp.push(me.identityUuid);
        this.txnService.updateTxn2Store(this.ticket.conversationGroupId, {
          lastAssignedAgents: temp
        });
      }
    });
  }

  private getTicketPlaceholder(convo: ConversationGroup) {
    let placeholder: string;
    this.convoName = convo.customerInfo?.name || UNKNOWN_USER;
    const validWhatsApp = this.checkWhatsAppValid(convo.whatsappLastReceivedDate);
    if (validWhatsApp) {
      placeholder = `Message to ${this.convoName}`;
    }
    return placeholder;
  }

  private checkWhatsAppValid(date: Date) {
    return this.getTime() - this.getTime(date) < TimeConst.FULL_DAY;
  }

  getTime(date?: Date) {
    if (date) {
      return new Date(date).getTime();
    }

    return new Date().getTime();
  }
}

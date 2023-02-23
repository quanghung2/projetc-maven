import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChatTypeTxn } from '@b3networks/api/callcenter';
import { ContactQuery } from '@b3networks/api/contact';
import { TxnChatLog, TxnStatusChat } from '@b3networks/api/data';
import {
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationType,
  CustomerInfo,
  GroupType,
  Status
} from '@b3networks/api/workspace';
import { Txn } from '@b3networks/chat/shared/core';
import { Observable } from 'rxjs';

export interface PreviewHistoryTxnData {
  txn?: TxnChatLog;
  txnActive?: Txn;
}

@Component({
  selector: 'b3n-preview-history-txn',
  templateUrl: './preview-history-txn.component.html',
  styleUrls: ['./preview-history-txn.component.scss']
})
export class PreviewHistoryTxnComponent implements OnInit {
  ticket: ConversationGroup;
  loading: boolean;
  viewDate$: Observable<number>;
  displayNameCustomer: string;

  constructor(
    private dialogRef: MatDialogRef<PreviewHistoryTxnComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewHistoryTxnData,
    private convoGroupService: ConversationGroupService,
    private convoGroupQuery: ConversationGroupQuery,
    private contactQuery: ContactQuery
  ) {}

  ngOnInit() {
    this.loading = true;
    let convo: ConversationGroup;
    if (this.data?.txn) {
      this.displayNameCustomer = this.data.txn.customer?.displayName;
      convo = new ConversationGroup(<Partial<ConversationGroup>>{
        conversationGroupId: this.data.txn.txnUuid,
        conversations: [
          {
            conversationId: this.data.txn.txnUuid,
            conversationType: ConversationType.public,
            members: []
          }
        ],
        customerInfo: <CustomerInfo>{
          uuid: this.data.txn.customer?.chatCustomerId,
          name: this.data.txn.customer?.displayName
        },
        createdAt: new Date(),
        status: this.data.txn.status === TxnStatusChat.end ? Status.archived : Status.opened,
        type: this.data.txn.channel === ChatTypeTxn.livechat ? GroupType.Customer : GroupType.WhatsApp
      });
    } else if (this.data.txnActive) {
      const contact = this.contactQuery.getEntity(this.data.txnActive?.customerUuid);
      this.displayNameCustomer = contact?.displayName;
      convo = new ConversationGroup(<Partial<ConversationGroup>>{
        conversationGroupId: this.data.txnActive.txnUuid,
        conversations: [
          {
            conversationId: this.data.txnActive.txnUuid,
            conversationType: ConversationType.public,
            members: []
          }
        ],
        customerInfo: <CustomerInfo>{
          uuid: contact?.chatCustomerId,
          name: contact?.displayName || 'Unknown Contact'
        },
        createdAt: new Date(),
        status: Status.opened,
        type: this.data.txnActive.channel === ChatTypeTxn.livechat ? GroupType.Customer : GroupType.WhatsApp
      });
    }

    this.convoGroupService.addConversation2Store(convo);
    this.ticket = convo;
    this.loading = false;

    this.viewDate$ = this.convoGroupQuery.selectUIState(this.ticket.conversationGroupId, 'viewDate');
  }
}

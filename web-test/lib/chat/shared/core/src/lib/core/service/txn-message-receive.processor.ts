import { Injectable } from '@angular/core';
import { ChatTypeTxn, MeQuery as CCMeQuery, TxnType } from '@b3networks/api/callcenter';
import { Contact, ContactQuery, ContactService } from '@b3networks/api/contact';
import {
  ActionCase,
  CaseMessageData,
  ChatMessage,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  MeQuery,
  MsgType,
  Status
} from '@b3networks/api/workspace';
import { CapitalizeCasePipe } from '@b3networks/shared/common';
import { BrowserNotificationService, NotificationRouterLink } from '@b3networks/shared/notification';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MessageConstants } from '../constant/message.const';
import { Txn } from './txn/txn.model';
import { TxnQuery } from './txn/txn.query';
import { TxnService } from './txn/txn.service';

@Injectable({ providedIn: 'root' })
export class TxnMessageReceiveProcessor {
  constructor(
    private meQuery: MeQuery,
    private browserNotification: BrowserNotificationService,
    private toastService: ToastService,
    private txnQuery: TxnQuery,
    private txnService: TxnService,
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private capitalizeCasePipe: CapitalizeCasePipe,
    private contactQuery: ContactQuery,
    private contactService: ContactService,
    private ccMeQuery: CCMeQuery
  ) {}

  process(message: ChatMessage) {
    if (message.err) {
      this.toastService.error(message.err);
      return;
    }

    if (message?.mt !== MsgType.case) {
      return;
    }

    const data: CaseMessageData = message.body.data;
    if (data.action === ActionCase.notifyAgent) {
      return;
    }

    const isSupervisor = this.ccMeQuery.getMe()?.isSupervisor;
    const me = this.meQuery.getMe();

    // add customer2store with isTemporary
    const contact = this.contactQuery.getEntity(data?.customerUuid);
    if (!contact || contact?.isTemporary) {
      const mapingContact = <Contact>{
        uuid: data.customerUuid,
        displayName: data.customerName,
        chatCustomerId: data.chatCustomerId,
        isTemporary: true
      };

      // ActionCase.txnTag2Case + endChat. BE not support
      if ([ActionCase.txnTag2Customer, ActionCase.assignTxn].indexOf(data.action) > -1) {
        mapingContact.contactLists = data.contactListType;
        mapingContact.type = data.customerType;
      }

      this.contactService.updateContacts2Store([mapingContact]);
    }

    if (data.action === ActionCase.txnTag2Customer) {
      const txn = this.transferTxn2Store(data, message.client_ts);
      this.txnService.updateTxn2Store(data.txnUuid, txn);

      // notify
      if (![TxnType.outgoing, TxnType.incoming2extension].includes(data.txnType)) {
        let needNotify: boolean, type: string, title: string;
        const routerLink = <NotificationRouterLink>{
          commands: ['contacts', data?.customerUuid, 'txns', 'active']
        };
        if (isSupervisor) {
          // for all
          type = this.getTypeTxn(data);
          title = MessageConstants.NOTIFY_NEW_TXN_IN_CONTACT(data?.customerName, type);
          needNotify = true;
        } else {
          if (data?.members?.indexOf(me.identityUuid) > -1) {
            // for me
            type = this.getTypeTxn(data);
            title = MessageConstants.NOTIFY_NEW_TXN_IN_CONTACT(data?.customerName, type);
            needNotify = true;
          }
        }

        if (needNotify) {
          this.browserNotification
            .sendNotify(
              title,
              <NotificationOptions>{
                icon: `https://ui.b3networks.com/external/icon/unified_workspace_128.png`
              }, // hardcoding for whatsapp first
              routerLink
            )
            .subscribe();
        }
      }
    } else if (data.action === ActionCase.assignTxn) {
      if (!isSupervisor && this.txnService.listNotifyAssign2Me.indexOf(data.txnUuid) === -1) {
        if (
          ![TxnType.outgoing, TxnType.incoming2extension].includes(data.txnType) &&
          data?.members?.indexOf(me.identityUuid) > -1
        ) {
          // for me
          this.txnService.listNotifyAssign2Me.push(data.txnUuid);
          const type = this.getTypeTxn(data);
          const title = MessageConstants.NOTIFY_NEW_TXN_IN_CONTACT(data?.customerName, type);
          const routerLink = <NotificationRouterLink>{
            commands: ['contacts', data?.customerUuid, 'txns', 'active']
          };
          this.browserNotification
            .sendNotify(
              title,
              <NotificationOptions>{
                icon: `https://ui.b3networks.com/external/icon/unified_workspace_128.png`
              }, // hardcoding for whatsapp first
              routerLink
            )
            .subscribe();
        }
      }
      // add or update txn
      const txn = this.transferTxn2Store(data, message.client_ts);
      this.txnService.updateTxn2Store(data.txnUuid, txn);
    } else if (data.action === ActionCase.endChat) {
      const detail = this.txnQuery.getEntity(data.txnUuid);
      if (detail) {
        const txn = <Txn>{
          ...detail,
          closed: true
        };

        this.txnService.updateTxns2Store([txn]);
      }

      // archived conversationGroup
      const convo = this.convoGroupQuery.getEntity(data.txnUuid);
      if (convo) {
        this.convoGroupService.updateConversations2Store([
          <ConversationGroup>{
            ...convo,
            conversationGroupId: convo.conversationGroupId,
            status: Status.archived
          }
        ]);
      }
    }
  }

  private getTypeTxn(data: CaseMessageData) {
    return data.txnType === TxnType.chat
      ? data.channel === ChatTypeTxn.livechat
        ? 'Livechat'
        : data.channel === ChatTypeTxn.whatsapp
        ? 'Whatsapp'
        : 'Chat'
      : this.capitalizeCasePipe.transform(data.txnType);
  }

  private transferTxn2Store(data: CaseMessageData, client_ts: number): Txn {
    const txn = <Txn>{
      txnUuid: data.txnUuid,
      txnType: data.txnType,
      customerUuid: data.customerUuid,
      createdAt: data?.startedAtByUnix || client_ts,
      lastAssignedAgents: data?.members,
      channel: data?.channel || ChatTypeTxn.whatsapp,
      unreadCount: 1
    };
    if (data.members) {
      txn.lastAssignedAgents = data.members;
    }
    if (data.caseCode) {
      txn.caseCode = data.caseCode;
    }
    if (data.metadata) {
      txn.metadata = data.metadata;
    }
    return txn;
  }
}

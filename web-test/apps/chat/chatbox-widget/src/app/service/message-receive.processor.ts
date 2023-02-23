import { Injectable } from '@angular/core';
import { CustomersQuery, CustomersService, UIConfig } from '@b3networks/api/callcenter';
import { ChatBotService } from '@b3networks/api/integration';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConvoGroupStoreName,
  ConvoType,
  HistoryMessageService,
  MsgType,
  Status,
  SystemMsgType,
  WindownActiveService
} from '@b3networks/api/workspace';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { BrowserNotificationService, NotificationRouterLink } from '@b3networks/shared/notification';
import { ToastService } from '@b3networks/shared/ui/toast';
import { EntityStoreAction, runEntityStoreAction } from '@datorama/akita';

const SUPPORTED_CONVOS = [ConvoType.whatsapp, ConvoType.call, ConvoType.customer];

@Injectable({ providedIn: 'root' })
export class MessageReceiveProcessor {
  constructor(
    private messageService: HistoryMessageService,
    private toastService: ToastService,
    private chatService: ChatService,
    private customersQuery: CustomersQuery,
    private customersService: CustomersService,
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private windownActiveService: WindownActiveService,
    private chatBotService: ChatBotService,
    private browserNotification: BrowserNotificationService
  ) {}

  process(message: ChatMessage) {
    if (message.err) {
      this.toastService.error(message.err);
      return;
    }

    if ([MsgType.case, MsgType.transfer].indexOf(message.mt) > -1) {
      return;
    }

    if (ConvoType.customer.indexOf(message.ct) === -1) {
      return;
    }

    const customer = this.customersQuery.getValue();

    if (message.id == null && message.user === customer.chatCustomerId && message.isStore) {
      //add 2 store
      this.messageService.addMessage(message);
    } else {
      if (message.st) {
        // this.handleSystemMessage(message);
      } else {
        const convo = this.convoGroupQuery.getConvo(message.convo);
        this.processMsg(convo, message);
      }
    }
  }

  private processMsg(convo: ConversationGroup, message: ChatMessage) {
    const customer = this.customersQuery.getValue();
    if (message.isStore) {
      this.messageService.addMessage(message);
    }

    if (message.isStore) {
      // notify
      this.showCustomerNotification(message, convo);

      if (message.user !== customer.chatCustomerId) {
        runEntityStoreAction(ConvoGroupStoreName, EntityStoreAction.UpdateEntities, update =>
          update(convo.id, { unreadCount: (convo.unreadCount || 0) + 1 })
        );
      }
    }

    if (message.mt === MsgType.system) {
      this.handleCustomSystemMessage(convo, message);
    }
  }

  private handleCustomSystemMessage(convo: ConversationGroup, message: ChatMessage) {
    if (!message.body.data) {
      return;
    }

    switch (message.body.data.type) {
      case SystemMsgType.archived:
        runEntityStoreAction(ConvoGroupStoreName, EntityStoreAction.UpdateEntities, update =>
          update(convo.id, { status: Status.archived, archivedBy: message.user })
        );
        break;
    }
  }

  private showCustomerNotification(message: ChatMessage, convo: ConversationGroup) {
    // convo can be null
    if (message.mt === MsgType.system) {
      return;
    }

    const customer = this.customersQuery.getValue();
    if (customer.chatCustomerId === message.user) {
      return;
    }

    if (this.windownActiveService.windowActiveStatus) {
      if (customer.ui.isOpenChat) {
        return;
      }
    }

    let content = '';
    if ([MsgType.attachment, MsgType.prechatsurvey].indexOf(message.mt) > -1) {
      content = message.body.data.name;
    } else {
      content = this.getMessageNotificationContent(message);
    }

    if (this.chatBotService.hasBot) {
      this.fireNotify(message, convo, 'Chatbot', content);
    } else {
      this.fireNotify(message, convo, 'Agent', content);
    }
  }

  private fireNotify(message: ChatMessage, convo: ConversationGroup, displayName: string, content: string) {
    let title = 'New message';
    let contentFinnal = content;
    if (message.mt === MsgType.attachment) {
      title = MessageConstants.NOTIFY_NEW_ATTACHMENT(displayName);
    } else {
      if (displayName) {
        contentFinnal = `${displayName}: ${content}`;
      }
      // agent
      title = MessageConstants.NOTIFY_NEW_MSG_AGENT_IN_WIDGET(displayName);
    }

    const routerLink = <NotificationRouterLink>{
      commands: []
    };

    this.browserNotification
      .sendNotify(
        title,
        // <NotificationOptions>{ body: contentFinnal, icon: `https://ui.b3networks.com/external/icon/workspace_128.png` }, // hardcoding for whatsapp first
        <NotificationOptions>{
          body: contentFinnal,
          icon: `https://ui.b3networks.com/external/icon/unified_workspace_128.png`
        }, // hardcoding for whatsapp first
        routerLink
      )
      .subscribe(action => {
        if (action['isClicked']) {
          this.customersService.updateUI(<UIConfig>{
            isOpenChat: true
          });
        }
      });
  }

  private getMessageNotificationContent(msg: ChatMessage): string {
    const text =
      msg.mt === MsgType.email
        ? ''
        : !!msg.body?.title
        ? msg.body.title
        : !!msg.body?.text
        ? msg.body.text
        : !msg.body.data
        ? ''
        : !!msg.body.data?.text
        ? msg.body.data.text
        : '';
    return text;
  }
}

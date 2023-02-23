import { MetadataTxnWidget } from '@b3networks/api/auth';
import { Contact } from '@b3networks/api/contact';

export class CustomerChatBox extends Contact {
  identityUuid: string;
  orgUuid: string;

  // ui flow mcq
  answers: string[];
  ui: UIConfig;
}

export interface UIConfig {
  isLandscape: boolean;
  isMobile: boolean;
  isCollapse: boolean;
  showFooter: boolean;
  waitingChatbot: boolean;
  domain: string;
  titleDomain: string;
  queueUuid: string;
  botId: string;
  livechatId: string;

  // logic widget v2
  isOpenChat: boolean;

  // inbox
  isInboxFlow: boolean;
  widgetUuid: string;
}

export interface ResquestCreateTxn {
  orgUuid: string;
  name: string;
  email: string;
  dest: string;
  convoId: string; // if txn tag to case, new txn
  metadata: MetadataTxnWidget;

  // optional
  queueUuid: string;
  livechatId: string;
}

export interface ResquestCreateChatSession {
  orgUuid: string;
  convoId: string; // existing conv
  name: string;
  email: string;
  number: string;
  widgetUuid: string;
  metadata: MetadataTxnWidget;
}

export interface ResponseTxn {
  chatSession: {
    addr: string;
    id: string;
    token: string;
  };
  convoInfo: {
    id: string;
  };
  token: string;
}

import { ChatTypeTxn } from '@b3networks/api/callcenter';

export interface TxnChatLog {
  txnUuid: string;
  agentUuids: string[]; // identityUuids
  time: number;
  status: TxnStatusChat;
  channel: ChatTypeTxn;
  customer: {
    chatCustomerId: string;
    customerUuid: string;
    displayName: string;
  };
}

export enum TxnStatusChat {
  end = 'end',
  ongoing = 'ongoing'
}

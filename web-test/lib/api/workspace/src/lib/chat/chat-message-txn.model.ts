import { ChatTypeTxn } from '@b3networks/api/callcenter';
import { SystemMsgType } from '../enums.model';

export interface TxnMessageData {
  type: SystemMsgType;
  txnUuid: string;
  inboxUuid: string;
  publicConvoId: string;
  channel: ChatTypeTxn;
  assignees: string[];
  customer: {
    uuid: string;
    displayName: string;
    chatUserId: string;
  };
  txnTypeId: number;
  txnSeverityId: number;
  productIds: number[];
}

import { MetadataTxnWidget } from '@b3networks/api/auth';
import { ChatTypeTxn, TxnType } from '@b3networks/api/callcenter';
import { Contact } from '@b3networks/api/contact';

export class Txn {
  channel: ChatTypeTxn;
  txnUuid: string;
  txnType: TxnType;
  createdAt: number;
  lastAssignedAgents: string[]; // maping active txns , identity string
  unreadCount: number;
  metadata?: MetadataTxnWidget;

  // old logic , txn tag to case when close ,
  // caseCode = null is active , else is closed
  caseCode: string;

  // new logic , txn closed from ms-data
  closed: boolean;

  // inbox flow
  inboxUuid: string;
  publicConvoId: string;
  teamConvoId: string;
  customerUuid: string;
  customerName: string;
  severityId: number;
  typeId: number;
  productIds: number[];

  // ui
  isTemporary: boolean;

  constructor(obj?: Partial<Txn>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get isClosed() {
    return this.closed || !!this.caseCode;
  }
}

export enum TxnChannel {
  livechat = 'livechat',
  whatsapp = 'whatsapp',
  email = 'email',
  supportCenter = 'supportCenter'
}

export interface AssignLeftReq {
  txnUuid: string;
  agentUuid: string; // support for usecase that supervisor kick someone
}

export interface RespActivePendingTxn {
  txns: Txn[];
  contacts: Contact[];
}

export interface RequestGetAllTxns {
  customerUuid: string;
  type: 'call' | 'chat';
  channel: ChatTypeTxn;
  page?: number;
  perPage?: number;
}

export interface RequestFilterTxns {
  status: TxnStatus;
  inboxUuid: string; // optional
  assignedMode: AssignedMode;
  groupBy: TxnGroupBy;
}

export enum TxnStatus {
  active = 'active', // has assigned
  pending = 'pending', // assigned = 0
  ended = 'ended'
}

export enum AssignedMode {
  me = 'me', // assigned to me
  others = 'others', // assigned to others
  all = 'all'
}

export enum TxnGroupBy {
  txn = 'txn',
  customer = 'customer'
}

export interface RequestUpdateTxns {
  typeId?: number;
  severityId?: number;
  addProductIds?: number[];
  removeProductIds?: number[];
}

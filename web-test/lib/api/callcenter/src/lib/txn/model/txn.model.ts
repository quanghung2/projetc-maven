import { MetadataTxnWidget } from '@b3networks/api/auth';
import { AgentId, PopupShowedOn } from '../../agent/agent-config';
import { LicenceType } from '../../licence/licence';
import { ChatTypeTxn, TxnType } from './txn.enum';

export interface Customer {
  displayName: string;
  emails: CustomerEmail[];
  familyName: string;
  fullName: string;
  givenName: string;
  numbers: CustomerNumber[];
  orgUuid: string;
  uuid: string;
}

interface CustomerEmail {
  email: string;
}

interface CustomerNumber {
  number: string;
}

export class TxnAssignedAgent {
  createdAt: string;
  extKey: string;
  extLabel: string;
  extension: any;
  id: AgentId;
  licence: LicenceType;
  popupShowedOn: PopupShowedOn;

  get extensionString() {
    if (this.extLabel) {
      return `${this.extLabel} (#${this.extKey})`;
    }
    return '';
  }

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface ExtensionDetail {
  extKey: string;
  extLabel: string;
  identityUuid: string;
  orgUuid: string;
}

export class Txn {
  txnUuid: string;
  callerId: string;
  incomingNumber: string; // incomming type
  contactNumber: string; // callback type
  customerNumber: string; // auto dialer
  status: string;
  startedAt: string;
  startedAtByUnix: number;
  talkingAt: string;
  queueLabel: string;
  queueUuid: string;
  lastAssignedAgents: TxnAssignedAgent[];
  type: TxnType;
  onTransferCall: boolean;
  onTransferCall2Queue: boolean;
  channel: ChatTypeTxn | string;
  customer: Customer;
  sender: string;
  from: string;
  to: string;
  fromExtension: ExtensionDetail;
  toExtension: ExtensionDetail;
  destinationNumber: string;

  // txn in UW
  unreadCount: number;
  metadata: MetadataTxnWidget;

  get fromExtensionInfo() {
    return this.fromExtension ? `${this.fromExtension.extKey} - ${this.fromExtension.extLabel}` : null;
  }

  get toExtensionInfo() {
    return this.toExtension ? `${this.toExtension.extKey} - ${this.toExtension.extLabel}` : null;
  }

  get fromDisplay() {
    return this.callerId || this.fromExtensionInfo || this.from;
  }

  get toDisplay() {
    return this.incomingNumber || this.contactNumber || this.destinationNumber || this.toExtensionInfo || this.to;
  }

  get customerPhoneNumber() {
    switch (this.type) {
      case TxnType.incoming:
        return this.callerId;
      case TxnType.callback:
        return this.contactNumber;
      default:
        return this.customerNumber;
    }
  }

  get isTalking() {
    return this.status === 'talking';
  }

  get realStatus() {
    return this.onTransferCall || this.onTransferCall2Queue ? 'transferring' : this.status;
  }

  get lastAssignedAgentUuid() {
    return this.lastAssignedAgents && this.lastAssignedAgents.length > 0
      ? this.lastAssignedAgents[this.lastAssignedAgents.length - 1].id.identityUuid
      : null;
  }

  get assignedAgentString() {
    return this.lastAssignedAgents && this.lastAssignedAgents.length > 0
      ? this.lastAssignedAgents[this.lastAssignedAgents.length - 1].extensionString
      : null;
  }

  get durationInSeconds() {
    return (new Date().getTime() - this.startedAtByUnix) / 1000;
  }

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      if (obj['lastAssignedAgents']) {
        this.lastAssignedAgents = obj['lastAssignedAgents'].map(agent => new TxnAssignedAgent(agent));
      }
    }
  }
}

/**
 * A factory function that creates Txn
 */
export function createTxn(params: Partial<Txn>) {
  return {} as Txn;
}

export interface TxnFilter {
  types: TxnType[];
}

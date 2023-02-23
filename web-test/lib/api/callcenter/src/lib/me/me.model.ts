import { MemberRole, UPPER_ADMIN_ROLES } from '@b3networks/api/auth';
import { ExtType } from '@b3networks/api/bizphone';
import { Agent, PopupShowedOn, SystemStatusCode } from '../agent/agent-config';
import { AgentWorkflowConfig, DetailCustomField, PopupNotificationMode } from '../queue/queue.model';
import { DirectInboundCalls, DirectOutboundCalls, TxnType } from '../txn/model/txn.enum';

export class Me extends Agent {
  assignedTxn: AssignedTxn;
  callerId: string;
  popupShowedOn: PopupShowedOn;
  loginIp: string;
  role: MemberRole;
  type: ExtType;

  constructor(obj?: Partial<Me>) {
    super(obj);
    if (obj) {
      Object.assign(this, obj);
      if (this.assignedTxn) {
        this.assignedTxn = new AssignedTxn(this.assignedTxn);
      }
    }
  }

  get adminRole() {
    return UPPER_ADMIN_ROLES.includes(this.role);
  }

  get isOwner() {
    return [MemberRole.OWNER, MemberRole.SUPER_ADMIN].includes(this.role);
  }

  get isWrapupTime() {
    return this.assignedTxn && this.systemStatus === SystemStatusCode.acw;
  }

  get inAcwMode() {
    return this.systemStatus === SystemStatusCode.acw;
  }
}

export interface TxnDest {
  dest: string;
}

export class AssignedTxn {
  txnUuid: string;
  type: TxnType;
  status: string;
  queue: Queue;

  callerIdentityUuid: string; // not use property
  campaignUuid: string;
  channel: string;
  customerNumber: string;
  customerInfo: Map<string, any>;
  dests: TxnDest[]; // type === crossapp
  displayData: any;
  from: string; // direct call
  incomingNumber: any;
  ringTime: any;
  to: string; // direct call

  constructor(obj?: Partial<AssignedTxn>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get shouldPopupAcwPopup() {
    if (this.queue.agentWorkflowConfig.popupNotificationMode === PopupNotificationMode.dialing) {
      return true;
    }

    return this.status === 'talking' || this.status === 'ended' ? true : false;
  }

  get displayDataFormatted() {
    if (!this.displayData) {
      return '';
    }
    let message = '';
    Object.keys(this.displayData).forEach(key => {
      message += `${key}: ${this.displayData[key]}\n`;
    });

    return message;
  }

  get isIncommingCall() {
    return this.type === TxnType.incoming;
  }

  get typeShowPopup() {
    let type = this.type;
    // crossApp has 2 types popup : Direct inbound & Direct outbound ,depend on caller & callee
    // if callerAgentId != null => outbound ,else inbound
    if (type === TxnType.crossApp) {
      if (this.callerIdentityUuid) {
        type = TxnType.crossApp;
      } else {
        // more case to direct Inbound Calls Status
        type = TxnType.crossAppIn;
      }
    }

    if (DirectInboundCalls.includes(type)) {
      type = TxnType.crossAppIn;
    } else if (DirectOutboundCalls.includes(type)) {
      type = TxnType.crossApp;
    }

    return type;
  }

  get customerInfoInList(): CustomerInfo[] {
    const customerInfoInList = [];
    for (const key in this.customerInfo) {
      if (this.customerInfo.hasOwnProperty(key)) {
        customerInfoInList.push(<CustomerInfo>{ header: key, data: this.customerInfo[key] });
      }
    }

    return customerInfoInList;
  }
}

export interface CustomerInfo {
  header: string;
  data: string;
}

export interface Queue {
  uuid: string;
  label: string;
  customFields: DetailCustomField[];
  agentWorkflowConfig: AgentWorkflowConfig;
}

/**
 * A factory function that creates Me
 */
export function createMe(params: Partial<Me>) {
  return new Me(params);
}

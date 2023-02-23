import { Extension } from '@b3networks/api/bizphone';
import { LicenceType } from '../licence/licence';
import { Me } from '../me/me.model';

export interface AgentId {
  domain: string;
  identityUuid: string;
  label: string;
  orgUuid: string;
}

export class AgentConfig {
  id: AgentId;
  extKey: string;
  extLabel: string;
  licence: LicenceType;
  popupShowedOn: PopupShowedOn;
  extension?: Extension;

  constructor(obj?: Partial<AgentConfig>) {
    if (obj) {
      if (obj.extension) {
        obj.extension = new Extension(obj.extension);
      }
      Object.assign(this, obj);
    }
  }

  get displayText() {
    return `${this.extLabel} (#${this.extKey})`;
  }
}

export enum SystemStatusCode {
  dialing = 'dialing',
  talking = 'talking',
  acw = 'acw',
  free = 'free',
  blockDial = 'blockDial',
  away = 'away'
}

export interface SystemStatus {
  systemStatusExpiredAt: number;
  lastAssignedAt: number;
  lastUnassignedAt: number;
  lastPickupAt: number;
  lastFreeAt: number;
  status: SystemStatusCode;
}

export enum AgentStatus {
  available = 'available',
  busy = 'busy',
  offline = 'offline',
  dnd = 'dnd',
  enabled = 'enabled',
  disabled = 'disabled'
}

export enum AgentState {
  available = 'Available',
  wrapping = 'Wrapping',
  talking = 'Talking',
  dialing = 'Dialing',
  busy = 'Busy',
  offline = 'Offline',
  away = 'Away'
}

export enum PopupShowedOn {
  none = 'none',
  web = 'web',
  app = 'app',
  webNapp = 'webNapp'
}

export interface AssignedQueue {
  uuid: string;
  label: string;
}

export class Agent {
  identityUuid: string;
  extKey: string;
  extLabel: string;
  licence: LicenceType;
  numberOfQueue: number;

  status: AgentStatus;
  systemStatus: SystemStatusCode;
  statusDuration: number;
  busyReason: string;

  // assignedQueues: AssignedQueue[] = []; // update when get assigned queues

  constructor(obj?: Partial<Agent>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayText() {
    return `${this.extLabel} (#${this.extKey})`;
  }

  get state() {
    if (
      (this.systemStatus === SystemStatusCode.free || this.systemStatus === SystemStatusCode.blockDial) &&
      this.status === AgentStatus.available
    ) {
      return AgentState.available;
    } else if (this.systemStatus === SystemStatusCode.away || this.status === AgentStatus.dnd) {
      return AgentState.away;
    } else if (
      this.systemStatus === SystemStatusCode.acw &&
      (this.status === AgentStatus.available || this.status === AgentStatus.busy || this.status === AgentStatus.offline)
    ) {
      return AgentState.wrapping;
    } else if (
      this.systemStatus === SystemStatusCode.talking &&
      (this.status === AgentStatus.available || this.status === AgentStatus.busy || this.status === AgentStatus.offline)
    ) {
      return AgentState.talking;
    } else if (
      this.systemStatus === SystemStatusCode.dialing &&
      (this.status === AgentStatus.available || this.status === AgentStatus.busy || this.status === AgentStatus.offline)
    ) {
      return AgentState.dialing;
    } else if (
      !(
        this.systemStatus === SystemStatusCode.talking ||
        this.systemStatus === SystemStatusCode.acw ||
        this.systemStatus === SystemStatusCode.dialing
      ) &&
      this.status === AgentStatus.busy
    ) {
      return AgentState.busy;
    } else if (
      !(
        this.systemStatus === SystemStatusCode.talking ||
        this.systemStatus === SystemStatusCode.acw ||
        this.systemStatus === SystemStatusCode.dialing
      ) &&
      this.status === AgentStatus.offline
    ) {
      return AgentState.offline;
    } else {
      return '';
    }
  }

  get isSupervisor() {
    return this.licence === LicenceType.supervisor;
  }

  get statusPriority() {
    //Avai > Busy > Off
    if (this.status === AgentStatus.available) {
      return 1;
    } else if (this.status === AgentStatus.busy) {
      return 2;
    } else {
      return 3;
    }
  }

  syncupNewStatus(agent: Me | Agent) {
    this.status = agent.status;
    this.systemStatus = agent.systemStatus;
    this.statusDuration = 0; // reset status duration
  }
}

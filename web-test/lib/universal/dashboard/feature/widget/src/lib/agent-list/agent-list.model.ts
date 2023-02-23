import { AgentState, AgentStatus, SystemStatusCode } from '@b3networks/api/callcenter';

export class AgentRecord {
  uuid: string;
  agent: string;
  assignedQueues: string[];
  status: string;
  systemStatus: string;
  lastChangeStatusAt: number;
  lastAssignedAt: number;
  lastPickupAt: number;
  lastUnassignedAt: number;
  lastFreeAt: number;
  allStatusChangedAt: number;
  statusDuration: number;
  incomingAssigned = 0;
  callbackAssigned = 0;
  incomingAnswered = 0;
  incomingUnanswered = 0;
  callbackAnswered = 0;
  callbackUnanswered = 0;
  incomingSumTalkDuration = 0;
  callbackSumTalkDuration = 0;
  incomingMaxTalkDuration = 0;
  callbackMaxTalkDuration = 0;
  sumAvailableDuration: number | string;
  sumBusyDuration: number | string;
  sumOfflineDuration: number | string;

  constructor(obj?: Partial<AgentRecord>) {
    if (obj) {
      Object.assign(this, obj);

      this.allStatusChangedAt = Math.max(
        this.lastChangeStatusAt,
        this.lastAssignedAt,
        this.lastPickupAt,
        this.lastUnassignedAt,
        this.lastFreeAt
      );

      this.statusDuration = this.allStatusChangedAt > 0 ? new Date().getTime() - this.allStatusChangedAt : 0;
    }
  }

  get state() {
    if (
      (this.systemStatus === SystemStatusCode.free || this.systemStatus === SystemStatusCode.blockDial) &&
      this.status === AgentStatus.available
    ) {
      return AgentState.available;
    } else if (this.systemStatus === SystemStatusCode.away) {
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

  get avgTalkDuration() {
    return this.answered > 0 ? this.sumTalkDuration / this.answered : 0;
  }

  get sla() {
    const total = this.answered + this.unanswered;
    return total > 0 ? `${Math.round((this.answered / total) * 100)} %` : '-';
  }

  get assigned() {
    return this.incomingAssigned + this.callbackAssigned;
  }

  get answered() {
    return this.incomingAnswered + this.callbackAnswered;
  }

  get unanswered() {
    return this.incomingUnanswered + this.callbackUnanswered;
  }

  get sumTalkDuration() {
    return this.incomingSumTalkDuration + this.callbackSumTalkDuration;
  }

  get maxTalkDuration() {
    return this.incomingMaxTalkDuration + this.callbackMaxTalkDuration;
  }
}

export class AgentRecordV2 {
  uuid: string;
  extKey: string;
  agent: string;
  numberOfQueue: number;
  status: string;
  systemStatus: string;
  statusDuration: number;
  sla: string;
  assigned: number;
  answered: number;
  unanswered: number;
  avgTalkDuration: number;
  sumTalkDuration: number;
  maxTalkDuration: number;
  sumAvailableDuration: number;
  sumBusyDuration: number;
  sumOfflineDuration: number;
  sumAwayDuration: number;

  constructor(obj?: Partial<AgentRecordV2>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get agentLabel() {
    return `${this.agent} (#${this.extKey})`;
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

  get statusPriority() {
    //Avai > Away > Busy > Off
    if (this.status === AgentStatus.available) {
      return 1;
    } else if (this.status === AgentStatus.dnd) {
      return 2;
    } else if (this.status === AgentStatus.busy) {
      return 3;
    } else {
      return 4;
    }
  }
}

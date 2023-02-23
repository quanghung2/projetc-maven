import { Period } from '../report/report.model';

export class ReportV4Resp<T> {
  columnOrder: string[];
  fileName: string;
  rows: T[];

  constructor(obj?: Partial<ReportV4Resp<T>>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  withBuiltRows(rows: T[]) {
    this.rows = rows;
    return this;
  }
}

export class FormattedV4Report {
  code: string;
  type: Period;
  label: string;
  iam: boolean;
  custom: boolean;

  constructor(obj: Partial<FormattedV4Report>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

/**
 * Using filter or queryString
 * Filter with {key: value} style
 * QueryString with lucene style search query with escaped content
 * Exam:
 * - "queryString": "\"answered\" AND \"+6598300241\""
 * - "filter": { "a": "a1", "b": ["b1", "b2"] }
 */
export interface GetReportV4Payload {
  period: Period;

  orgUuid: string; // option
  endTime: string;
  startTime: string;
  scope?: string;
  teamUuid?: string; // scope = team
  filter?: any;
  queryString?: string;
  sort?: [{ time: 'desc' | 'asc' }];
}

export class ReportV4Code {
  // v2
  static recentCallUnifiedHistory2 = 'unifiedHistory2.call.lite';
  static recentLegUnifiedHistory2 = 'unifiedHistory2.leg.lite';
  static unifiedHistory2 = 'unified.history2';
  static unifiedHistory2Leg = 'unified.history2.leg'; //for leg view; personal scope
  static unifiedHistory2CallWeb = 'unifiedHistory2.call.web.inapp';
  static unifiedHistory2LegWeb = 'unifiedHistory2.leg.web.inapp';

  // v1
  static unifiedHistorySms = 'unifiedHistory.sms.inapp';

  static unifiedHistory = 'unified.history';
  static recentCallUnifiedHistory = 'unifiedHistory.call.lite';
  static chatUnifiedHistory = 'unifiedHistory.chat';
  static sellerGroupedBill = 'seller.groupedBill';
  static billingBuyerBalanceMovement = 'billing.buyer.balanceMovement';
  static callcenter = {
    agent: 'callcenter.agent',
    inbound: 'callcenter.inbound',
    callback: 'callcenter.callback',
    overflow: 'callcenter.inbound.overflow',
    autodialer: 'callcenter.autodialer',
    activity: 'callcenter.agent.activity',
    performance: 'callcenter.agent.performance'
  };
  static communication = {
    userPerformance: 'commhub.user.performance',
    callback: 'commhub.callback.inapp',
    callLive: 'commhub.call.live.inapp',
    state: 'user.state.curr',
    callbackEnded: 'commhub.callback.ended.inapp',
    inboundEnded: 'commhub.call.inbound.ended.inapp',
    activity: 'commhub.user.activity',
    userAssignedCall: 'commhub.user.assigned.inapp'
  };
  static dashboard = {
    inbound: 'callcenter.dashboard.inbound',
    callback: 'callcenter.dashboard.callback'
  };
  static unifiedHistoryDownload = {
    call: 'unifiedHistory.call',
    call2: 'unifiedHistory2.call',
    leg: 'unifiedHistory.leg',
    leg2: 'unifiedHistory2.leg',
    leg2v2: 'unifiedHistory2.leg2'
  };
  static unifiedSmsHistoryDownload = {
    sms: 'unifiedHistory.sms'
  };
  static edge = {
    leg: 'edge.legCdr'
  };
}

export interface ArchiveTxnPayload {
  startTime: string;
  endTime: string;
  orgUuid: string;
}

export interface ArchiveTxnResp {
  customerUuid: string;
  channel: string;
  txnUuid: string;
  time: number;
}
export class StateReport {
  readonly stateMapping = {
    available: 'Available',
    busy: 'Busy',
    dnd: 'Away',
    offline: 'Offline',
    dialing: 'Dialing',
    talking: 'Talking',
    holding: 'Holding',
    acw: 'After Call Work'
  };
  agentUuid: string;
  duration: string;
  extensionKey: string;
  extensionLabel: string;
  remark: string;
  state: string;

  constructor(obj?: Partial<StateReport>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayState() {
    return this.stateMapping[this.state];
  }
}

export interface CompletedCallReport {
  'ACW Duration': string;
  'Answer Time': string;
  Caller: string;
  Queue: string;
  Result: string;
  'Start At': string;
  'Talk Duration': string;
  'Txn UUID': string;
  User: string;

  'Callback Number': string;
  'Callback Start At': string;
  'Incoming Caller ID': string;
  'Incoming Txn UUID': string;
  'User Answer Time': string;
}

export interface AssignedCallReport {
  'Talk Duration': string;
  Type: 'Autodialer' | 'Incoming' | 'Callback';
  User: string;
  'Start At': string;
  From: string;
  To: string;
  'Incoming Txn UUID': string;
  Queue: string;
  'Answer Time': string;
  'Txn UUID': string;
  Result: string;
}

export interface AssignedCallReqFilter {
  'callcenter.queueType': 'incoming' | 'callback';
  accessors: string;
  'callcenter.queueUuid': string[];
  'callcenter.result': string[];
}

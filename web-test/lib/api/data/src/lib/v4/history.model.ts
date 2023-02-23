import { DeviceType, IncomingAction } from '@b3networks/api/bizphone';
import { HashMap } from '@datorama/akita';

export enum CallType {
  all = 'all', // use in filter
  incoming = 'incoming',
  outgoing = 'outgoing',
  forwarding = 'forwarding',
  internal = 'internal' // not v2
}

export enum StatusCall {
  all = 'all', // use in filter
  answered = 'answered',
  unanswered = 'unanswered',
  failed = 'failed',
  blocked = 'blocked',
  busy = 'busy',
  cancel = 'cancel',
  redirection = 'redirection', //only leg
  delegated = 'delegated' //only leg
}

export class Leg {
  legUuid: string;
  type: CallType;
  endTime: number;
  startTime: number;
  from: string;
  to: string;
  extensionKey: string;
  extensionLabel: string;
  device: DeviceType;
  sipUsername: string;
  status: StatusCall;
  errorCause?: string;
  errorIssuer?: string;
  identityUuid?: string;
  responseCode?: string;

  constructor(obj?: Partial<Leg>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface ResourceDetail {
  contentType: string;
  deleted: boolean;
  fileKey: string;
  name: ResourceName;
  mirrorUrl?: string;
}

export enum ResourceName {
  RECORDING = 'recording',
  VOICEMAIL = 'voicemail'
}

export interface BlockDetail {
  blockName: string;
  blockType: string;
  time: number;
  workFlowName: string;
}

export interface RingInfo {
  device: DeviceType;
  legUuid: string;
  status: StatusCall;
}

export interface IvrFlow {
  name: string;
  uuid: string;
}

// https://b3networks.atlassian.net/browse/UI-1783
export class UnifiedHistory {
  txnUuid: string;
  legUuid?: string;
  totalDuration: number;
  talkDuration: number;
  accessors: string[];
  resources: {
    recording: ResourceDetail;
    voicemail: ResourceDetail;
  };
  type: CallType;
  orgUuid: string;
  accessNumber: string;
  callcenter: CallcenterUnifiedHistory;
  compliance: ComplianceUnifiedHistory;
  flows: FlowInfo[];
  legs: Leg[];
  startTime: number;
  endTime: number;

  from: DetailCall;
  to: DetailCall;
  id: string;
  time: number;
  key: string;
  status: StatusCall;
  failedReason: string; // status === failed,blocked
  fileCallRecording: { filename: string; downloadUrl: string }; // render when play audio

  agents: AgentHistory[];

  translatedCallerId?: string;
  recording?: ResourceDetail;
  contactName?: string;
  voicemail?: ResourceDetail;

  blocks: BlockDetail[];
  ringGroup: RingInfo[];
  showVoicemail: boolean;
  ivrFlow: IvrFlow;
  recordingDisrupted: boolean;

  constructor(obj?: Partial<UnifiedHistory>) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.legs) {
        this.legs = obj.legs.map(x => new Leg(x)) || [];
      }
      if (!this.resources && (this.recording || this.voicemail)) {
        this.resources = {
          recording: this.recording,
          voicemail: this.voicemail
        };
      }
    }
  }

  get agentStatus(): string {
    const agent: AgentHistory = this.agents?.find(a => a.identityUuid === this.to?.identityUuid);
    return agent?.status || '';
  }

  get tooltipMessage(): string {
    const agent: AgentHistory = this.agents?.find(a => a.identityUuid === this.to?.identityUuid);
    return agent ? this.toFriendlyMessage(agent) : '';
  }

  get agentStatusForLegLevel(): string {
    const identityUuids = this.legs?.map(l => l.identityUuid);
    const agent = this.agents?.find(a => identityUuids.includes(a.identityUuid));
    return agent?.status || '';
  }

  get toolTipMessageForLegLevel(): string {
    const identityUuids = this.legs?.map(l => l.identityUuid);
    const agent = this.agents?.find(a => identityUuids.includes(a.identityUuid));
    return agent ? this.toFriendlyMessage(agent) : '';
  }

  toFriendlyMessage(agent: AgentHistory): string {
    const status = agent.status === 'dnd' ? 'Away' : agent.status;
    const statusAction = agent.statusAction ? ` - ${agent.statusAction?.split('_').join(' ')}` : '';
    return status + statusAction;
  }
}

export interface AgentHistory {
  identityUuid: string;
  status: 'available' | 'busy' | 'dnd' | 'offline';
  statusAction?: IncomingAction;
  extensionKey?: string;
  extensionLabel?: string;
}

export interface FlowInfo {
  executionTime: number;
  projectUuid: string;
  flowUuid: string;
  version: number;
  executionUuid: string;

  // meta data
  projectName: string;
  flowName: string;
}

export interface CallcenterUnifiedHistory {
  queueUuid: string;
  queueName: string;

  // leg view
  agentStatus: 'available' | 'busy' | 'dnd' | 'offline';
  agentStatusAction: IncomingAction;
}

export enum ActionCompliance {
  blockedByDnc = 'blockedByDnc',
  blockedBecauseOfFailed = 'blockedBecauseOfFailed',
  goThrough = 'goThrough'
}

export interface ComplianceUnifiedHistory {
  action: ActionCompliance;
  bypassReason: string;
  pdpcId: string;
}

export interface DetailCall {
  number: string;
  device: DeviceType;
  extensionKey: string;
  extensionLabel: string;
  sipUsername: string;
  originalDest?: string;
  identityUuid: string;
}

//UI-1429
export const DNCByPassReason: HashMap<string> = {
  userConfigBypass: 'User bypassed PDPC',
  userForceBypass: 'User bypassed PDPC',
  notSubscribedDnc: "User hasn't DNC subscription"
};

export const ReasonMapping: HashMap<string> = {
  numberNotAssignedToUser: 'Number Have Not Assigned To User',
  internalServerError: 'Internal Server Error',
  invalidBillableAccount: 'Invalid Billable Account',
  invalidMsisdn: 'Invalid MSISDN',
  invalidNumber: 'Invalid Number',
  subscriptionExpired: 'Expired Subcription',
  numberSuspended: 'Suspended Number',
  destSuspended: 'Suspended Destination',
  billableAccountSuspended: 'Suspended Billable Account',
  invalidSession: 'Invalid Session',
  forwardingDisabled: 'Disabled Forwarding',
  serviceNotAvailable: 'Unavailable Service',
  srcNumInvalid: 'Invalid Source Number',
  destNumInvalid: 'Invalid Destination Number',
  sipDestInvalid: 'Invalid Sip Destination',
  orgIdInvalid: 'Invalid OrgId',
  sessionEnded: 'Session Have Been Ended',
  insufficientCredits: 'Insufficient Credits',
  concurrentCallLimitReached: 'Concurrent Call Have Reached Limit',
  busy: 'Busy',
  accountSuspended: 'Suspended Account',
  prefixBlocked: 'Prefix has been Blocked',
  rateNotBeSet: 'Rate Have Not Been Set',
  missingAppNotifyUrlConfig: 'Missing Application Notify Url',
  requestTimeout: 'Request Time Out',
  concurrentCallDurationNotEnough: 'Concurrent Call Duration Not Enough',
  forwardingNotConfigured: 'Forwarding Have Not Been Configured',
  ipAuthNoIpPeers: 'Ip Auth No Ip Peers',
  srcIpNotAllowed: 'Source Ip Is Not Allowed',
  destinationCountryNotAllowed: 'Destination Country Is Not Allowed',
  blockedByDnc: 'Blocked By DNC',
  blockedByConsent: 'Blocked By Consent',
  blockedBecauseOfExpiredSubscription: 'Blocked by DNC Subscription Expired',
  blockedByCheckAndAsk: 'Blocked By Check And Ask',
  invalidDestination: 'Extension Not Found',
  blockedByCountryBlackList: 'Blocked by Country Blacklist',
  noOutboundRule: 'No Outbound Rule was Set',
  blockedBecauseOfFailed: 'Failed to check due to PDPC high traffic',
  destBusy: 'Destination is busy now',
  clientIssue: 'Failed to reach client device / application',
  customFilterRejected: 'Blocked by Inbound Call Filter',
  blockedByNoOutboundRule: 'No Outbound Rule was Set',
  blockedByDisableInternalCommunicationFlag: 'Internal call is not allowed',
  anonymousRejected: 'Reject anonymous caller call'
};

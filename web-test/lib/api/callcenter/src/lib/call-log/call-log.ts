// this model mapping for log only

export enum CallLogResult {
  answered = 'answered',
  unanswered = 'unanswered',
  voicemail = 'voicemail',
  callback = 'callback',
  abandoned = 'abandoned',
  overflow = 'overflow'
}

export interface Duration {
  connecting: number;
  holding: number;
  talking: number;
  waiting: number;
  wrapping: number;
}

export interface Voicemail {
  voiceMailRecordUrl: string;
  voiceMailRecordStatus: string;
}

export interface Connecting {
  agentUuid: string;
  extensionKey: string;
  extensionLabel: string;
}

export interface Waiting {
  timestamp: number;
}

export interface FirstData {
  waiting: Waiting;
  voicemail: Voicemail;
  connecting: Connecting;
}

export class CallLogTxn {
  id: number;
  count: number;
  first: FirstData;
  endTime: string;
  agentUuid: string;
  otpStatus: string;
  queueUuid: string;
  latestTime: string;
  earliestTime: string;

  status: string;
  txnUuid: string;
  callerId: string;
  incomingNumber: string; // for incoming txn
  contactNumber: string; // for callback txn
  destinationNumber: string; // for auto dialer txn
  totalWaitingDuration: string; // for unswered callback txn
  timestamp: number;
  talkDuration: number;
  waitDuration: number;
  connectingDuration: number;
  durations: Duration;
  extensionLabel: string;
  extensionKey: string;
  queueName: string;
  voicemailUrl: string;
  voiceMailRecordStatus: string;
  note: string;
  code: string;
  tag: { [key: string]: string | string[] };
  displayData: any;
  whoForceHangup: string;

  get agentString() {
    if (this.extensionLabel) {
      return `${this.extensionLabel} (#${this.extensionKey})`;
    }
    return '';
  }

  get isRecoredVoicemail() {
    return this.first.voicemail.voiceMailRecordUrl && this.first.voicemail.voiceMailRecordStatus === 'success';
  }

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

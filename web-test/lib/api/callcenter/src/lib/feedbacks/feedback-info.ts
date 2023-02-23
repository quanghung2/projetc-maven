export class FeedbackInfo {
  id: number;
  key: string;
  time: number;
  domain: string;
  status: string;
  orgUuid: string;
  txnUuid: string;
  callerId: string;
  agentUuid: string;
  createdAt: string;
  queueName: string;
  queueUuid: string;
  timestamp: string;
  extensionKey: string;
  extensionLabel: string;
  feedbackRate: number;
  receivedTime: string;
  customerNumber: string;
  feedbackMessage: string;
  smsSenderNumber: string;

  get agentString(): string {
    if (this.extensionLabel) {
      return `${this.extensionLabel} (#${this.extensionKey})`;
    }
    return '';
  }

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class FeedbackHistoryReq {
  startTime: string;
  endTime: string;
  orgUuid: string;
  queueUuid: string;
  extensionLabel: string;
  customerNumber: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class FeedbackTxnInfo {
  agentExtensionKey: string;
  agentLabel: string;
  agentUuid: string;
  createdAt: string;
  customerNumber: string;
  domain: string;
  orgUuid: string;
  queueLabel: string;
  queueUuid: string;
  smsSenderNumber: string;
  status: string;
  txnUuid: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(obj, this);
    }
  }
}

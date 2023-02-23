export class CallLogTxnV4 {
  txnUuid: string;
  callerId: string;
  destinationNumber: string;
  at: string;
  campaignName: string;
  queueUuid: string;
  queueName: string;
  extensionName: string;
  talkDuration: string; // duration answered
  connectAndWaitDuration: string; // duration unanswered
  note: string;
  dispositionCode: string;
  result: string;
  status: string;
  voiemailUrl: string;
  hangupBy: string;
  overflowAction: string; // value if resultNew === 'overflow'
  resultNew: string;

  constructor(obj?: Partial<CallLogTxnV4>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

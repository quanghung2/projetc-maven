export class Txn {
  txnUuid: string;
  orgUuid: string;
  ivrFlowUuid: string;
  appId: string;
  source: string;
  accessNumber: string;
  extensions: string[] = [];
  usableStartTime: string;
  usableEndTime: string;
  usableDuration: string;
  usableExtensions: string[] = [];
  details: any = {};

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

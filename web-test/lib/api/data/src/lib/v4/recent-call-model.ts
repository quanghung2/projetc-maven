import { CallType } from './history.model';

export interface ResponseRecentCall {
  customerUuid: string;
  customerDisplayName: string;
  from: string;
  txnUuid: string;
  to: string;
  customerNumbers: string;
  callType: CallType;
}

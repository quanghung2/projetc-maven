import { TxnType } from './txn.enum';

export interface FinishACWReq {
  session: string;
  type: TxnType;
  code: string;
  note?: string;
}

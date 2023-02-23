export interface LogBulkFilteringReq {
  from: string;
  to: string;
  page: number;
  perPage: number;
}

export class LogBulkFiltering {
  txn_uuid: string;
  commit_status: string;
  created_at: string;
  credential_detail: string;
  credential_type: string;
  credential_uuid: string;
  number_of_dnc_charged: number;
  number_of_dnc_check: number;
  number_of_free_dnc_check: number;
  postback_result: string;
  remark: string;

  constructor(obj?: Partial<LogBulkFiltering>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get status() {
    return this.commit_status === 'committed' ? (this.postback_result ? 'Completed' : 'Failed') : 'Pending';
  }
}

export interface LookupRate {
  billing: {
    commitStatus: string;
    committed: boolean;
    noCharged: boolean;
    numberOfDncCharged: number;
    numberOfDncCheck: number;
    numberOfFreeDncCheck: number;
    reservationId: string;
  };
}

export interface LookupRateReq {
  media: string;
  credentialUuid: string;
  credentialType: string;
  appId: string;

  csvKey?: string;
  remarks?: string;
  numbers?: string;
}

export enum MediumStatus {
  voice = 'voice',
  sms = 'sms',
  fax = 'fax'
}

export enum ResultLookupNumber {
  blocked = 'blocked',
  permitted = 'permitted'
}

export interface LookupNumber {
  time: number;
  number: string;
  credentialDetail: string;
  medium: MediumStatus;
  result: ResultLookupNumber;
  cause: CauseNumber;
  bypassReason: string;
  pdpcTxnId: string;
  txnUuid: string;

  // ui
  displayResult: string;
}

export interface DPOLookup {
  medium: MediumStatus;
  cause: CauseNumber;
  pdpcTxnId: string;
  result: ResultLookupNumber;
}

export enum CauseNumber {
  consent = 'consent',
  coverage = 'coverage',
  bypass = 'bypass',
  licence = 'licence',
  credit = 'credit',
  dnc = 'dnc'
}

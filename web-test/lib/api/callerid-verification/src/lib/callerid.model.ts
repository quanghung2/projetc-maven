export class FindCallerIdsResp {
  ack: string;
  data: string[];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get isSuccess() {
    return this.ack === 'success';
  }
}

export interface SenderData {
  number: string[];
  rebrand: string[];
  sender: string[];
}

export interface SMSSender {
  countryCode: string;
  id: string;
  orgUuid: string;
  sender: string[];
}

export interface UpdateGlobalBlacklistReq {
  action: 'add' | 'remove';
  keywords: string[];
}

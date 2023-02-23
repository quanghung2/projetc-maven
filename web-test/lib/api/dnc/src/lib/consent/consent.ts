export class Consent {
  number: string;
  createdAt: number;
  orgUuid: string;
  updatedAt: number;
  sms: StatusConsent;
  fax: StatusConsent;
  voice: StatusConsent;

  constructor(obj?: Partial<Consent>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum StatusConsent {
  notRecorded = 'notRecorded',
  blacklist = 'blacklist',
  whitelist = 'whitelist',
  none = 'none'
}

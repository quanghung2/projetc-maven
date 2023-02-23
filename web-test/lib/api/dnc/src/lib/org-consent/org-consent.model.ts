import { StatusConsent } from '../consent/consent';

export class OrgConsent {
  number: string;
  voice: StatusConsent;
  sms: StatusConsent;
  fax: StatusConsent;
  updated: number;
  created: number;
}

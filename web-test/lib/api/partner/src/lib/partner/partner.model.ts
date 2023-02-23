export class Partner {
  partnerUuid: string;
  domain: string;
  type: string;
  domainOwnerName: string;
  portalName: string;
  salesEmail: string;
  logoUrl: string;
  supportedCurrencies: string[];
  faviconUrl: string;
  partnerName: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

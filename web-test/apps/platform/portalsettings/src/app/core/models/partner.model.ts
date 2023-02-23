export class PartnerDomain {
  domain: string;
  partnerUuid: string;
  type: string;
  partnerName: string;
  portalName: string;
  senderEmail: string;
  supportEmail: string;
  salesEmail: string;
  logoUrl: string;
  faviconUrl: string;
  supportedCurrencies: string[];

  constructor(value: Object) {
    this.salesEmail = '';
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key) && value[key] != null) {
          this[key] = value[key];
        }
      }
    }
  }
}

export class Partner {
  domain: string;
  status: string;
  shortName: string;

  constructor(value: Object) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}

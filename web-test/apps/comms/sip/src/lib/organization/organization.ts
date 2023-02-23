export class UnverifiedEmails {
  email: string;
  token: string;
  createdDateTime: string;
  lastTriggeredDateTime: string;
  expiryDateTime: string;
}

export class BillingInfo {
  name: string;
  emails: string[];
  unverifiedEmails: UnverifiedEmails[];
  addressLineOne: string;
  addressLineTwo: string;
  city: string;
  countryCode: string;
  zip: string;
  state: string;
  receiveInvoice: boolean;
  brandingCustomer: boolean;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if ('unverifiedEmails' in obj) {
      this.unverifiedEmails = obj['unverifiedEmails'];
    }
  }
}

export class Organization {
  uuid: string;
  orgUuid: string;
  name: string;
  shortName: string;
  logoUrl: string;
  walletUuid: string;
  walletCurrencyCode: string;
  currencyCode: string;
  createdDateTime: string;
  domain: string;
  timezone: string;
  countryCode: string;
  status: string;
  intergrationCode: string;
  timeFormat: string;
  billinggInfo: BillingInfo;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if ('billingInfo' in obj) {
      this.billinggInfo = new BillingInfo(obj['billingInfo']);
    }
  }

  get utcOffset(): string {
    return this.timezone ? this.timezone.substring(3, 8) : '+0800';
  }
}

export class CreateCompanyRequestV2 {
  constructor(
    public name: string,
    public shortName: string,
    public billingEmail: string,
    public description: string,
    public logoUrl: string,
    public timezoneUuid: string,
    public countryCode: string
  ) {}
}

export class CreateCompanyV2Response {
  public uuid: string;
}

export class CreateCompanyFormRequest {
  constructor(public name: string, public country: string, public timezone: string) {}
}

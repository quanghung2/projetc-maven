export class UnverifiedEmails {
  email: string;
  token: string;
  createdDateTime: string;
  lastTriggeredDateTime: string;
  expiryDateTime: string;
}

export class BillingInfo {
  billingName: string;
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
  billingEmail: string; // use to add email

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
  createdDateTime: number;
  domain: string;
  timezone: string;
  countryCode: string;
  status: string;
  intergrationCode: string;
  timeFormat: string;
  billingInfo: BillingInfo;
  isPartner: boolean;
  licenseEnabled: boolean;
  msTeamsTenant: MsTeamsTenant;
  type: 'ADMIN' | 'DEMO' | 'CUSTOMER';

  constructor(obj?: any) {
    Object.assign(this, obj);
    if ('billingInfo' in obj) {
      this.billingInfo = new BillingInfo(obj['billingInfo']);
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

export interface ChangeCompanyRequest {
  newName: string;
  additionalComments: string;
  orgUuid: string;
}

export interface UpdateCompanyRequest {
  billingInfo: BillingInfo;
  logoUrl: string;
  name: string;
  shortName: string;
  timezoneUuid: string;
  orgUuid: string;
  timeFormat: string;
}

export class OrgRole {
  currentRole: string;
  availableRoles: string[];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get isAdmin() {
    return (
      this.currentRole.toLowerCase() === 'owner' ||
      this.currentRole.toLowerCase() === 'super_admin' ||
      this.currentRole.toLowerCase() === 'admin'
    );
  }
}

export interface MemberCount {
  count: number;
}

export class PinPolicy {
  inactivityTimeoutMinutes: number;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export interface FindOrganizationReq {
  name?: string;
}

export interface QueryOrgPolicy {
  service: string;
  action: string;
}

export interface QueryOrgReq {
  keyword?: string;
  licenseEnabled?: boolean;
}

export interface SetDemoReq {
  demo: boolean;
}

export interface MsTeamsTenant {
  tenantId: string;
}

export interface CheckOrganizationResponse {
  name: string;
  domain: string;
  portalDomain: string;
}

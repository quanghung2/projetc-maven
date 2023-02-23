export class User {
  appId: string;
  availableCallerIds: string[];
  chargeableOrgUuid: string;
  deviceUuid: string;
  displayName: string;
  domain: string;
  email: string;
  identityUuid: string;
  mobileNumber: string;
  orgName: string;
  orgUuid: string;
  role: string;
  timeFormat: string;
  timezone: string;
  uuid: string;
  walletCurrencyCode: string;
  walletUuid: string;

  constructor(obj?) {
    Object.assign(this, obj);
  }

  get timezoneOffset(): string {
    return this.timezone.substr(3, 5) || '+0800';
  }
}

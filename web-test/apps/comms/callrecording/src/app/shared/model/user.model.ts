import { BaseModel } from './base.model';

export class User extends BaseModel {
  public sessionToken: string = null;
  public orgUuid: string = null;

  public uuid: string = null;
  public orgOldUuid: string = null;
  public chargeableOrgUuid: string = null;
  public domain: string = null;
  public walletUuid: string = null;
  public walletCurrencyCode: string = null;
  public role: string = null;
  public status: string = null;
  public complianceLicense: number = null;

  public displayName: string = null;
  public givenName: string = null;
  public familyName: string = null;
  public countryCode: string = null;
  public timezone: string = null;
  public timeFormat: string = null;
  public createdDateTime: Date = null;
  public registeredIp: string = null;
  public photoUrl: string = null;
  public isHasSub: boolean = false;
  public email: string = null;
  public mobileNumber: string;
  public timezoneOffset: string = null;
  // public isEnableCallLogForManager: boolean = false; // added by Thai, enable call log by manager permission, aia
  public isEnableCompliance: boolean = false; // aia

  public callerIds: string[] = []; // new compliance config
  public isAllowAll: boolean = false; // new compliance config
  public selected: boolean = false;
}

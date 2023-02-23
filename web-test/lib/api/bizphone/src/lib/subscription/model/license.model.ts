export enum EnumPriceModel {
  V1 = 'v1',
  V2 = 'v2'
}

export class License {
  orgUuid: string;
  domain: string;
  primarySubsUuid: string;
  crLicense: number;
  isCRCompliance: boolean;
  dncLicense: number;
  apiLicense: boolean;
  callCenterLicense: CallCenterLicense;
  pricingModel: EnumPriceModel;
  isActive: boolean;
  mobileLicense: number; // v1
  ipPhoneLicense: number; // v1
  extensionLicense: number; // v2

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.callCenterLicense = new CallCenterLicense(obj?.callCenterLicense);
    }
  }
}

export class UsageLicense {
  extLicense: ExtLicense;
  dncLicense: number;
  crLicense: number;
  agentLicense: number;
  supervisorLicense: number;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.extLicense = new ExtLicense(obj?.extLicense);
    }
  }
}

export class ExtLicense {
  mobileLicense = 0; // v1
  ipPhoneLicense = 0; // v1
  extensionLicense = 0; // v2
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CallCenterLicense {
  agentLicenceQuota: number;
  supervisorLicenceQuota: number;
  isActive: boolean;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

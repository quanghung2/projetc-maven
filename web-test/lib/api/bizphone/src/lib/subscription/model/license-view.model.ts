import { EnumPriceModel } from './license.model';
import { SubscriptionBiz } from './subscription.model';

export class LicenseDisplayModel {
  pricingModel: EnumPriceModel;
  maxExt = 0; // v2
  useExt = 0; // v2

  maxIpPhone = 0; // v1
  useIpPhone = 0; // v1
  maxMobile = 0; // v1
  useMobile = 0; // v1

  maxAgent = 0;
  useAgent = 0;
  maxSupervisor = 0;
  useSupervisor = 0;
  maxDNC = 0;
  useDNC = 0;
  maxCR = 0;
  useCR = 0;

  constructor(sub?: SubscriptionBiz) {
    if (sub) {
      this.pricingModel = sub.license.pricingModel;

      if (this.pricingModel === EnumPriceModel.V1) {
        this.maxIpPhone = sub.license.ipPhoneLicense;
        this.maxMobile = sub.license.mobileLicense;

        this.useIpPhone = sub.usageLicense.extLicense.ipPhoneLicense;
        this.useMobile = sub.usageLicense.extLicense.mobileLicense;
      } else {
        this.maxExt = sub.license.extensionLicense;
        this.useExt = sub.usageLicense.extLicense.extensionLicense;
      }

      this.maxDNC = sub.license.dncLicense;
      this.useDNC = sub.usageLicense.dncLicense;
      this.maxCR = sub.license.crLicense;
      this.useCR = sub.usageLicense.crLicense;
      this.maxAgent = sub.license.callCenterLicense.agentLicenceQuota;
      this.useAgent = sub.usageLicense.agentLicense;
      this.maxSupervisor = sub.license.callCenterLicense.supervisorLicenceQuota;
      this.useSupervisor = sub.usageLicense.supervisorLicense;
    }
  }
}

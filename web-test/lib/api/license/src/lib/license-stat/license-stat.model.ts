import { LicenseFeatureCode } from '../constant';

export interface LicenseStatsData {
  total: number;
  available: number;
  assigned: number;
}

export class LicenseStatistic {
  productId: string;
  productName: string;
  sku: string;
  skuName: string;
  statsByUser: LicenseStatsData;
  statsByMapping: LicenseStatsData;
  featureCodes: string[];
  type: 'BASE' | 'ADDON';
  available: boolean;
  quantity: number;

  constructor(obj?: Partial<LicenseStatistic>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  // check base license type
  get isExtension() {
    return this.featureCodes.includes(LicenseFeatureCode.extension) && !this.isCallGroup;
  }

  get isCallGroup() {
    return this.featureCodes.includes(LicenseFeatureCode.call_group);
  }

  get isAutoAttendant() {
    return this.featureCodes.includes(LicenseFeatureCode.auto_attendant);
  }

  get isDeveloper() {
    return this.featureCodes.includes(LicenseFeatureCode.developer);
  }

  // check add-on license type
  get isNumber() {
    return this.featureCodes.includes(LicenseFeatureCode.number);
  }

  get isSim() {
    return this.featureCodes.includes(LicenseFeatureCode.sim);
  }

  // check license level
  get isPerUserLicense() {
    return this.isExtension;
  }

  get hasResource() {
    return this.isExtension || this.isCallGroup || this.isAutoAttendant;
  }

  get hasManualProvission() {
    return this.isExtension || this.isCallGroup;
  }
}

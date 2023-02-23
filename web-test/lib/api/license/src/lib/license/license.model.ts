import { BundleItem } from '../bundle/bundle.model';
import { LicenseFeatureCode } from '../constant';

export interface ResourceInfo {
  extKey?: string; // when resource is ext and assigned
  number?: string; // when resource is number and assigned
  sku?: string; // when resource is number
  isDevice?: boolean; // check if number is MSISDN
  physicalSimStatus: {
    linkedAt: number;
    physicalSimAddonId: number;
  };
}

export interface ResourceDetail {
  key?: string;
  info: ResourceInfo;
}

export interface GetLicenseReq {
  skus: string[];
  identityUuid?: string;
  resourceKey?: string;
  includeMappings?: boolean;
  includeResources?: boolean;
  hasResource?: boolean; // filter provisioned or not for license need manually provision
  hasUser?: boolean;
  hasAddon?: boolean;
  type?: 'ADDON' | 'BASE';
  teamUuid?: string;
}

export interface AddonLicenseMapping {
  sku: string;
  skuName: string;
  quantity: number;
  displayText: string;
  isNumber: boolean;
}

export class License {
  id: number;
  orgUuid: string;
  subscriptionUuid: string;
  sku: string;
  skuName: string;
  identityUuid: string;
  featureCodes: string[];
  mappings: License[];
  resource?: ResourceDetail;

  type: 'BASE' | 'ADDON';
  status: 'ACTIVE' | 'EXPIRED';

  // info agg at client side
  assignedUser: string;
  activatedLicenses: string;
  addonLicenseMappings: AddonLicenseMapping[];

  constructor(obj?: Partial<License>) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.mappings) {
        this.mappings = obj.mappings.map(m => new License(m));
      }
    }
  }

  get displayText() {
    let text = this.skuName;
    if (this.resource && (this.isExtension || (this.isNumber && !!this.resource.key))) {
      text += ' (' + (this.isExtension ? 'Ext.' : '') + (this.resource.key || '-') + ')';
    } else if (this.resource && !!this.resource.key && this.isCallGroup) {
      text += ` (${this.resource.key}) `;
    }
    return text;
  }

  get resourceKey() {
    return this.resource && this.resource.key;
  }

  get isPerUserLicense() {
    return this.isExtension;
  }

  get isExtension() {
    return this.featureCodes.includes(LicenseFeatureCode.extension) && !this.isCallGroup;
  }

  get isCallGroup() {
    return this.featureCodes.includes(LicenseFeatureCode.call_group);
  }

  get isDeveloper() {
    return this.featureCodes.includes(LicenseFeatureCode.developer);
  }

  get isAutoAttendant() {
    return this.featureCodes.includes(LicenseFeatureCode.auto_attendant);
  }

  get isNumber() {
    return this.featureCodes.includes(LicenseFeatureCode.number);
  }

  get isSim() {
    return this.featureCodes.includes(LicenseFeatureCode.sim);
  }

  get isSipIpAuthen() {
    return this.mappings.some(p => p.featureCodes.includes(LicenseFeatureCode.license_sip_ip_authen));
  }

  get isSipHA() {
    return this.mappings.some(p => p.featureCodes.includes(LicenseFeatureCode.license_sip_ha));
  }

  get isSelectedNumber() {
    return this.isNumber && !!this.resource.key;
  }

  get isUnSelectedNumber() {
    return this.isNumber && !this.resource.key;
  }

  get isSMPP() {
    return this.mappings.some(p => p.featureCodes.includes(LicenseFeatureCode.license_smpp));
  }
}

export interface CreateExtReq {
  extKey: string;
}

export interface CreateNumberReq {
  number: string;
}

export type CreateResourceReq = CreateExtReq | CreateNumberReq;

export interface LicenseResource {
  info: ResourceInfo;
  licenseId: number;
}

export interface MappingLicenseConfig {
  sku: string;
  quantity: number;
}

export interface SubscriptionLicense {
  items: BundleItem[];
  contractNumber?: string;
}

export interface CreateResourcesReq {
  extKeys: string[];
  type: 'extensions' | 'extensionGroups';
}

export interface FailedItem {
  extKey: string;
  error: string;
}

export interface CreatedItem {
  extKey: string;
  licenseId: number;
}

export interface CreateResourcesResp {
  createdItems: CreatedItem[];
  failedItems: FailedItem[];
}

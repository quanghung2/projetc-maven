import { SaleModel } from '@b3networks/api/salemodel';

export interface GetV3AppReq {
  features: string[];
  includeSku?: boolean;
  includeFeature?: boolean;
}

export enum FeatureType {
  Boolean = 'boolean',
  Number = 'number'
}

export interface Feature {
  code: string;
  label: string;
  value: null | string;
  type: FeatureType;
  isShown: boolean;
}

export class AppSku {
  id: string;
  name: string;
  features: Partial<Feature>[] = [];
  type: string;
  maxNumber: number | null;
  minNumber: number | null;
  isShown: boolean;
  relatedSKUs: AppSku[];
  requiredAppId: null;

  isNumber: boolean;
  skuType: 'base' | 'addon';

  constructor(obj?: Partial<AppSku>) {
    if (obj) {
      Object.assign(this, obj);
      this.features = this.features || [];
      this.skuType = this.features.findIndex(f => f.code === 'license_base') > -1 ? 'base' : 'addon';
      this.isNumber = this.features.findIndex(f => f.code === 'license_number') > -1;
    }
  }
}

export class ApplicationV3 {
  id: string;
  name: string;
  iconUrl: string;
  type: string;
  isBeta: boolean;
  onPortal: boolean;
  numberConfig: string;
  skus: AppSku[] = [];
  features: Feature[] = [];

  constructor(obj?: Partial<ApplicationV3>) {
    if (obj) {
      Object.assign(this, obj);
      this.skus = (this.skus || []).map(s => new AppSku(s));
    }
  }
}

// Store
export enum NumberConfig {
  none = <any>'none',
  single = <any>'single',
  multiple = <any>'multiple'
}

export enum VoiceMode {
  voice = <any>'voice',
  sms = <any>'sms',
  fax = <any>'fax'
}

export class App {
  private static requiredNumberConfigList: NumberConfig[] = [NumberConfig.single, NumberConfig.multiple];

  appId: string;
  name: string;
  numberConfig: NumberConfig;
  voiceMode: VoiceMode;
  iconUrl: string;

  requiredNumber() {
    return App.requiredNumberConfigList.indexOf(this.numberConfig) !== -1;
  }

  getNameInUrlPath(): string {
    return this.name.replace(/ /g, '');
  }
}

export class AppServiceModel {
  alias: string;
  code: string;
}

export class AppModel {
  appId: string;
  redirectUrl: string;
  description: string;
  displayPriority: number;
  hasFree: boolean;
  hasPaid: boolean;
  iconUrl: string;
  installationStatus: string;
  isBeta: boolean;
  isLabs: boolean;
  isMandatory: boolean;
  name: string;
  permissions: string;
  portalType: string;
  pricingTier: string;
  services: AppServiceModel[];
  subscriptionNotifyUrl: string;
  title: string;
  cleanName: string;
  path: string;
}

export class AppListResponse {
  entries: AppModel[];
  entries_count: number;
  status: string;
}

export class AppListResponseV2 {
  list: AppModel[];
  total: number;
}

export class SubscribedAppInfo {
  appId: string;
  iconUrl: string;
}

export class SubscribedAppResponse {
  appInfos: SubscribedAppInfo[];
}

export class SubscribedAppResponseV2 {
  applications: SubscribedAppInfo[];
}

export class AppStoreIconModel {
  url: string;
}

export class AppStoreModel {
  appId: string;
  categories: string[];
  icon: AppStoreIconModel;
  name: string;
  urlName: string;
  description: string;
}

export class AppListStoreResponse {
  applications: AppStoreModel[];
}

export class SkuFeature {
  featureCode: string;
  featureLabel: string;
  featureValue: number;
  type: string;
}

export class SkuDetail {
  name: string;
  type: string;
  features: SkuFeature[];
  uuid: string;
  saleModel: SaleModel[];
  description: string;
  maxNumber: number;
  minNumber: number = 0;
}

export class AppDetailResponse {
  appId: string;
  iconUrl: string;
  name: string;
  skuList: SkuDetail[] = [];
  numberConfig: string; // 'none', 'single', 'multiple'
  voiceMode: string[];
  type: string;

  constructor(data?: AppDetailResponse) {
    if (data) {
      for (var key in data) {
        this[key] = data[key];
      }
    }
  }

  isAppDeveloperConsole() {
    return this.name == 'Developer Console Beta' || this.name == 'Developer Console';
  }

  hasNumberRequire() {
    return this.numberConfig != 'none';
  }

  hasAddonRequire() {
    let skuAddon = this.skuList.filter((item: SkuDetail) => {
      return item.type == 'addon';
    });
    return skuAddon && skuAddon.length > 0;
  }
}

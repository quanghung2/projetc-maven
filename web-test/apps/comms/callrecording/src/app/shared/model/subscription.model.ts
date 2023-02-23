import { BaseModel } from './base.model';

export enum AppType {
  SIP = 'sip',
  VIRTUAL_LINE = 'virtual_line',
  DIRECT_LINE = 'direct_line',
  BIZ_PHONE = 'biz_phone',
  WALLBOARD = 'wallboard',
  extensions = 'extensions',
  number = 'number'
}

export class CRSubscription extends BaseModel {
  public uuid: string = null;
  public orgUuid: string = null;
  public status: string = null;
  public plan: any = {};

  // extra
  public assignedTo: string = null;
  public assignedApp: any = null;
  public assignedPlan: number = null;
  public assignedDisplay: any = null;
  public assignDisplay: any = null;
  public assignedConfig: any = null;

  public recordingType: string = null;
  public apps: Array<any> = [];

  public appLogo: string = null;
  public appName: string = null;
}

export interface FindSubscriptionReq {
  productId?: string;
  sku?: string;
  includeAssignees?: boolean;
}
export class SubscriptionItem {
  amount: number;
  cost: number;
  productId: string;
  blocked: boolean;
  quota: number;
  costNextCycle: number;
  sku: string;
  saleModelCode: string;
  amountNextCycle: number;
  primary: boolean;
  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
export class Subscription {
  multiplier: number;
  uuid: string;
  trial: boolean;
  orgUuid: string;
  expiryDate: string;
  customerDiscount: number;
  domain: string;
  autoRenew: boolean;
  currency: string;
  activatedDate: string;
  items: SubscriptionItem[] = [];
  renewDate: string;
  status: string;
  assignees: string[] = [];
  constructor(obj?: any) {
    Object.assign(this, obj);
    if (this.items) {
      this.items = this.items.map(item => new SubscriptionItem(item));
    }
  }
  get mainSku(): string {
    const mainSku = this.items.find(item => item.primary);
    return mainSku ? mainSku.sku : null;
  }
}

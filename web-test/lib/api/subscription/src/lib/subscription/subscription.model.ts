import { HttpParams } from '@angular/common/http';
import { Member } from '@b3networks/api/auth';
import { NUMBER_PRODUCT_ID } from '@b3networks/shared/common';
import subDays from 'date-fns/subDays';

export type SubscriptionEmbeded = 'numbers' | 'assignees' | 'prices' | 'features';

export class FindSubscriptionReq {
  sku?: string;
  embed?: SubscriptionEmbeded[];
  productIds?: string[];
  assignee?: string;
  includeAssignees?: boolean;
  statuses?: string;
  uuid?: string;

  constructor(obj?: Partial<FindSubscriptionReq>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  toParams(): HttpParams {
    let params = new HttpParams();
    if (this.statuses) {
      params = params.set('statuses', this.statuses);
    }
    if (this.includeAssignees) {
      params = params.set('includeAssignees', String(this.includeAssignees));
    }
    if (this.sku) {
      params = params.set('sku', this.sku);
    }
    if (this.productIds && this.productIds.length) {
      params = params.set('productIds', this.productIds.join(','));
    }
    if (this.embed && this.embed.length) {
      params = params.set('embed', this.embed.join(','));
    }
    if (this.assignee) {
      params = params.set('assignee', this.assignee);
    }
    if (this.uuid) {
      params = params.set('uuid', this.uuid);
    }
    return params;
  }
}

export interface ProductFeature {
  id: number;
  featureCode: string;
  featureLabel: string;
  featureValue: string;
  isShow: boolean;
  type: string;
}

export class SubscriptionItem {
  amount: number;
  cost: number;
  productId: string;
  productName: string;
  blocked: boolean;
  quota: number;
  costNextCycle: number;
  sku: string;
  saleModelCode: string;
  amountNextCycle: number;
  primary: boolean;
  skuName: string;
  logo: string;
  quantity: number;
  features: ProductFeature[];

  constructor(obj?: Partial<SubscriptionItem>) {
    if (obj) {
      Object.assign(this, obj);
    }
    this.features = this.features || [];
  }
}

export interface NumberSubscription {
  number: string;
  sku: string;
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
  numbers: NumberSubscription[] = [];
  updatedDateTime: string;
  totalAmount: number;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (this.items) {
      this.items = this.items.map(item => new SubscriptionItem(item));
    }
  }

  get expiryDateInInclusive() {
    return subDays(new Date(this.expiryDate), 1);
  }

  get mainSku(): string {
    const mainSku = this.items.find(item => item.primary);
    return mainSku ? mainSku.sku : null;
  }

  get subscriptionName(): string {
    const primarySubscriptionItem = this.items.find(item => item.primary);
    const name = primarySubscriptionItem && 'skuName' in primarySubscriptionItem ? primarySubscriptionItem.skuName : '';
    return name;
  }

  get description() {
    const numbers = this.numbers.map(item => item.number);
    return `${this.subscriptionName} (${numbers.join(', ')})`;
  }

  get primaryItem() {
    return this.items.find(item => item.primary);
  }

  get blocked() {
    return this.items.some(i => i.blocked);
  }

  get countNumbers() {
    return this.items.filter(i => i.productId === NUMBER_PRODUCT_ID).reduce((sum, item) => sum + item.quantity, 0);
  }

  get features() {
    return this.items.filter(i => i.primary === false && i.productId !== NUMBER_PRODUCT_ID);
  }

  get displayTotalPrice() {
    return Math.round((this.totalAmount / this.multiplier) * 1000) / 1000;
  }

  get featureCodes() {
    const codes = [];
    this.items.forEach(i => i.features.forEach(f => codes.push(f.featureCode)));
    return codes;
  }
}

export class SubsctiptionRequestParams {
  autoRenew: boolean;
  saleModelCode: string;
  multiplier: number;

  constructor(obj?: Partial<SubsctiptionRequestParams>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface RemoveMemberReq {
  subscription: Subscription;
  member: Member;
}

export class RecoveryResponseV2 {
  subscriptionUuid: string;
  primaryProductId: string;
  primaryProductName: string;
  primarySku: string;
  primarySkuName: string;
  amount: number;
  isSelected: boolean;
}

export interface RouterState {
  orgUuid: string;
  recoveryUuid: string;
}

export interface ExportSubscriptionReq {
  emails: string[];
  statuses: string;
  productIds: string[];
}

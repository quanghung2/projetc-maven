export declare type BillingCycle = 'monthly' | 'yearly' | 'one_off';

export class SkuPrice {
  sku: string;
  saleModel: BillingCycle;
  currency: string;
  amount: number;
  isBlocked: boolean;

  constructor(obj?: Partial<SkuPrice>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface DNCSkuPrice {
  saleModel: {
    code: string;
    domainPrice: {
      currency: string;
      amount: number;
      isBlocked: boolean;
    }[];
  }[];
  skuCode: string;
}

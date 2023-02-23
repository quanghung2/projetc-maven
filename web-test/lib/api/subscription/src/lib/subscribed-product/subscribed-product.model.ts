export class SubscribedProduct {
  count: number;
  name: string;
  products: string[];
  subscriptionUuid: string;

  constructor(obj?: Partial<SubscribedProduct>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface GetSubscribedProductReq {
  includeAll: boolean;
  assigneed: string;
  subscriptionStatus: string;
}

export class SkuSubscription {
  constructor(
    public productId: string,
    public sku: string,
    public saleModelCode: string,
    public quota = 0,
    public primary?: boolean
  ) {}
}

export class PurchaseSubscriptionRequest {
  skus: SkuSubscription[] = [];
  autoRenew: boolean;
  multiplier: number = 1;
  trial: boolean;
}

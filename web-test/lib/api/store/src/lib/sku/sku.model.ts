import { SalesModel } from '@b3networks/api/salemodel';

const subscriptionCycle = {
  monthly: 'monthly',
  yearly: 'yearly'
};

export class Sku {
  sku: string;
  name: string;
  description: string;
  isPrimary: boolean;
  order: number;
  product_id: string;
  features: string[];
  price: number;
  status: 'PUBLISHED' | string;
  code: string;
  salesModels: SalesModel[] = [];

  static buildFromReponse(params: any): Sku {
    return new Sku({ code: params['sku'], name: params['name'], isPrimary: params['isPrimary'] });
  }

  static buildFromSalesModelResponse(params: any) {
    let salesModels: SalesModel[] = [];
    if (params['saleModel'] && params['saleModel'].length > 0) {
      salesModels = [];
      params['saleModel'].forEach(element => {
        const sm = SalesModel.buildFromResponse(element);
        if (sm != null) {
          salesModels.push(sm);
        }
      });
    }

    return salesModels.length > 0
      ? new Sku({ code: params['skuCode'], name: params['name'], isPrimary: null, salesModels })
      : null;
  }

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  getTotalCount(code: string) {
    if (this.salesModels.length === 0) {
      return 0;
    }
    return this.salesModels
      .filter(s => s.code === code)
      .map(s => s.amount)
      .reduce((a, b) => {
        return a + b;
      }, 0);
  }

  get subscriptionLestedCycleSupport() {
    if (!this.salesModels) {
      return null;
    }
    const salesModelCodes = this.salesModels.map(sm => sm.code);
    return salesModelCodes.indexOf(subscriptionCycle.monthly) !== -1
      ? subscriptionCycle.monthly
      : salesModelCodes.indexOf(subscriptionCycle.yearly)
      ? subscriptionCycle.yearly
      : null;
  }

  get isPublished() {
    return this.status === 'PUBLISHED';
  }
}

export interface GetSkuReq {
  productId: string;
  filter?: string;
}

export interface CreateProductSku {
  sku: string;
  name: string;
  status: 'PUBLISHED' | string;
  isPrimary: boolean;
  order: number;
}

export class PriceModel {
  currency: string;
  amount: number;
  isBlocked: boolean;
}

export class SaleModel {
  code: string; // billing cycle
  basePrice: PriceModel[]; // using for topup admin fee when they don't publish domain price
  domainPrice: PriceModel[];
}

export class SkuModel {
  skuCode: string;
  saleModel: SaleModel[];
}

export class SaleModelResponse {
  content: SkuModel[];
}

export class SaleModelSkuResponse {
  skuCode: string;
  saleModel: SaleModel[];
}

export class SaleModelDetail {
  code: string;
  subscription: SaleModelSubscription;
  type: string;
}

export class SaleModelSubscription {
  cycle: number;
  unit: string;
}

export class SalesModel {
  code: string;
  amount: number;
  currency: string;

  static buildFromResponse(params: any): SalesModel {
    if (!params['domainPrice'] || params['domainPrice'].length === 0) {
      return null;
    }
    const pricing = params['domainPrice'][0];
    return !pricing['isBlocked'] ? new SalesModel(params['code'], +pricing['amount'], pricing['currency']) : null;
  }

  constructor(code: string, amount: number, currency: string) {
    this.code = code;
    this.amount = amount;
    this.currency = currency;
  }
}

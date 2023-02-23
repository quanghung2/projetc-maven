export enum SkuType {
  primary = <any>'primay',
  number = <any>'number',
  addon = <any>'addon'
}

export class EstimatedSkuPrice {
  sku: string;
  name: string;
  amount: number;
  type: SkuType;

  constructor(sku: string, name: string, amount: number, type: SkuType) {
    this.sku = sku;
    this.name = name;
    this.amount = amount;
    this.type = type;
  }

  get isPrimarySku() {
    return this.type === SkuType.primary;
  }
}

export class EstimatedPrimarySkuPrice extends EstimatedSkuPrice {
  constructor(sku: string, name: string, amount: number) {
    super(sku, name, amount, SkuType.primary);
  }
}

export class EstimatedNumberSkuPrice extends EstimatedSkuPrice {
  country: string;
  selectedNumber: number;

  constructor(sku: string, name: string, amount: number) {
    super(sku, 'Number', amount, SkuType.number);
    this.country = name;
    this.selectedNumber = 1;
  }
}

export class EstimatedPrice {
  productId: string;
  currency: string;
  salesModelCode: string;
  skuPrices: EstimatedSkuPrice[] = [];

  constructor(productId: string, currency: string) {
    this.productId = productId;
    this.currency = currency;
  }

  get totalPrice() {
    return Number(
      this.skuPrices.length > 0 ? this.skuPrices.map(sku => sku.amount).reduce((a, b) => a + b) : 0
    ).toFixed(2);
  }
}

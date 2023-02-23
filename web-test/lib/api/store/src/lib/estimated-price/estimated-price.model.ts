export class StoreCostCurrency {
  currency: string;
  unitPriceTaxExcl: number;
  discount: number;
  effectiveDiscount: number;
  taxRate: number;
  taxCode: string;
  sellerUuid: string;
  productName: string;
  skuName: string;
  standaloneInvoiceTextTemplate: string;
  sellerCost: SellerCostStore;
  productId: string;
  skuCode: string;
  saleModelCost: string;

  constructor(value?: Partial<StoreCostCurrency>) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}
export class StoreCost {
  currency: string;
  unitPriceTaxExcl: number;
  discount: number;
  effectiveDiscount: number;
  taxRate: number;
  taxCode: string;
  itemCode: string;
  sellerUuid: string;
  productName: string;
  skuName: string;
  standaloneInvoiceTextTemplate: string;
  addonInvoiceTextTemplate: string;
  sellerCost: SellerCostStore;
  productId: string;
  skuCode: string;
  saleModel: string;

  constructor(value?: Partial<StoreCost>) {
    if (!!value) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          this[key] = value[key];
        }
      }
    }
  }
}
export interface SellerCostStore {
  currency: string;
  unitPriceTaxExcl: number;
  discount: number;
  effectiveDiscount: number;
  taxRate: number;
  taxCode: string;
  sellerUuid: string;
  productName: string;
  skuName: string;
  itemCode: string;
  standaloneInvoiceTextTemplate: string;
  addonInvoiceTextTemplate: string;
}

export interface GetCostStoreRequest {
  productId: string;
  skuCode: string;
  saleModelCost: string;
  currency: string;
}

export interface GetCostStoreBySkusRequest {
  productId: string;
  skuCode: string;
  saleModel: string;
  currency: string;
}

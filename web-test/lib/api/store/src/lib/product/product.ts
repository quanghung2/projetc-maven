import { Sku } from '@b3networks/api/store';

export enum ProductType {
  telecom = 'TELECOM',
  app = 'APP'
}

export class TypeProduct {
  type: string;
  name: string;
  totalCount: number;

  constructor(type: string, totalCount: any) {
    this.type = type;
    this.name = this.type.toLowerCase() !== 'hardware' ? this.type + 'S' : this.type;
    this.totalCount = +totalCount;
  }

  get label() {
    switch (this.type) {
      case 'APP':
        return 'LICENSE';
      default:
        return this.name;
    }
  }
}

const telcomProducts = {
  '1FXekqSRnDZ5p5hm': 'fax',
  iRaGV9pDvamvJOy8: 'fax', // Fax Beta
  '4ESLmjmXaWH0jcxT': 'call',
  KwaKqO8kkkTjGUXT: 'call',
  R8vdwGEirnQ607EV: 'call',
  f7bhafA3hB6xiBvJ: 'sms',
  '5UrKHpufDbLWOijG': 'call'
};

export class Product {
  productId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  type: ProductType | string;
  logo: string;
  selling: boolean;
  skus: Sku[];
  images: any;

  order?: number;

  constructor(obj?: Partial<Product>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get getSelling() {
    return this.selling ? 'Yes' : 'No';
  }

  get isApp() {
    return this.type === ProductType.app;
  }

  get telcomType() {
    return telcomProducts[this.productId];
  }

  get primarySkus() {
    return this.skus ? this.skus.filter(sku => sku.isPrimary) : [];
  }

  get smallestSubscriptionCycle() {
    return this.primarySkus.length > 0 ? this.primarySkus[0].subscriptionLestedCycleSupport : null;
  }

  isAppProduct() {
    return 'app' === this.type.toLowerCase();
  }

  getNameInUrlPath(): string {
    return this.name.replace(/ /g, '');
  }

  filterSkusByName(skuName: string) {
    return this.skus && skuName
      ? this.skus
          .filter(sku => sku.name.toLowerCase().indexOf(skuName.toLowerCase()) !== -1)
          .filter(sku => sku.salesModels != null && sku.salesModels.length > 0)
      : [];
  }

  getTelcomSurfixDescription() {
    return this.productId.indexOf('incoming') !== -1 ? 'From' : 'To';
  }
}

export interface AddProductReq {
  channelDomain: string;
  productIds: string[];
}

export interface GetAllProductReq {
  includeDescription?: boolean;
  productIds?: string[];
}

export interface GetAvailableProductReq {
  type: ProductType | string;
}

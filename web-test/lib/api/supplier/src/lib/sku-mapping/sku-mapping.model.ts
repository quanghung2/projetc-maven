import { SellerRoutingType } from '../seller-routing/seller-routing.model';

export interface SkuMapping {
  id?: number;
  type: SellerRoutingType;
  productId: string;
  sku: string;
  uuid?: string;
  name: string;
  isReference: boolean;
  destPrefixes: string[];
  srcPrefixes: string[];
  createdDate?: string;
  updatedDate?: string;
}

export class ParamForMapping {
  id: string;
  title: string;
  items: SkuMapping[];

  constructor(obj?: Partial<ParamForMapping>) {
    if (obj) {
      obj.title = obj.id.replace(' - ', '<br/>');
      Object.assign(this, obj);
    }
  }
}

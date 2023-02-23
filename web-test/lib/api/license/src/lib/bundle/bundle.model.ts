import { BillingCycle } from '@b3networks/api/salemodel';

export interface BundleItem {
  productId: string;
  sku: string;
  saleModelCode: BillingCycle;
  quantity: number;
  numberSku?: string | null;
  type?: 'BASE' | 'ADDON';
  autoRenew?: boolean;
  multiplier?: number;
  numberProduct?: string;
  numbers?: string[];
}

export enum BundleStatus {
  active = 'ACTIVE',
  deleted = 'DELETED'
}

export class Bundle {
  id: number | string;
  name: string;
  description: string;
  items: BundleItem[];
  status: BundleStatus;
  createdAt: number | string | null;
  updatedAt: number | string | null;
  published: boolean;

  constructor(obj?: Partial<Bundle>) {
    if (obj) {
      Object.assign(this, obj);
    }
    this.items = this.items || [];
  }

  get numbersItems() {
    return this.items.filter(i => !!i.numberSku);
  }
}

export function createBundle(_: Partial<Bundle>) {
  return {} as Bundle;
}

export interface GetBundleReq {
  statuses: BundleStatus[];
}

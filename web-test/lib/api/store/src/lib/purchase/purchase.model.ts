import { SkuDetail } from '@b3networks/api/app';
import { SkuSubscription } from '@b3networks/api/subscription';

export class PurchaseAddonModel {
  skus: SkuSubscription[] = [];
  totalPrice: number = 0;

  getTotalQuota() {
    return this.skus.reduce((sum: number, currentValue: SkuSubscription) => {
      return sum + currentValue.quota;
    }, 0);
  }
}

export class PurchaseProductSkuSaleModel {
  code: string;
  price: number;

  getBillingCycleText() {
    if (this.code == 'monthly') {
      return `Monthly`;
    } else if (this.code == 'yearly') {
      return `Annually`;
    } else if (this.code == 'one_off') {
      return `One Off`;
    }
    return '';
  }

  getNormalText() {
    if (this.code == 'monthly') {
      return `month`;
    } else if (this.code == 'yearly') {
      return `year`;
    }
    return '';
  }
}

export class PurchaseProductSkuModel {
  skuCode: string;
  skuName: string;
  skuDescription: string;
  saleModel: PurchaseProductSkuSaleModel[];
  selectedSaleModel: PurchaseProductSkuSaleModel;
  estimatedPrice: number = 0;
  maxNumber: number = 0;
  quantity?: number = 0;

  hasNumberRequire() {
    return this.maxNumber > 0;
  }

  getStandardEstimatedPrice() {
    return Math.round(this.estimatedPrice * 1000) / 1000;
  }
}

export class PurchaseSelectPlan {
  appName: string;
  skuList: PurchaseProductSkuModel[] = [];
  selectedPlan: PurchaseProductSkuModel;
  currency: string;

  isAppDeveloperConsole() {
    return this.appName == 'Developer Console Beta' || this.appName == 'Developer Console';
  }
}

export class NumberAddonSkuDetail {
  sku: string;
  name: string;
  price: number;
}

export class SkuAddonModel {
  sku: SkuSubscription;
  price: number;
  skuDetail: SkuDetail;
}

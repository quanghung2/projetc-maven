import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AppDetailResponse } from '@b3networks/api/app';
import { Organization } from '@b3networks/api/auth';
import { PriceModel, SaleModel } from '@b3networks/api/salemodel';
import {
  PurchaseAddonModel,
  PurchaseProductSkuSaleModel,
  PurchaseSelectPlan,
  SkuAddonModel
} from 'libs/api/store/src/lib/purchase/purchase.model';

@Component({
  selector: 'psh-select-addon',
  templateUrl: './select-addon.component.html',
  styleUrls: ['./select-addon.component.scss']
})
export class SelectAddonComponent implements OnInit {
  @Input() purchaseSelectPlan: PurchaseSelectPlan;
  @Input() selectedProduct: AppDetailResponse;
  @Input() organization: Organization;
  @Input() selectedAddon: PurchaseAddonModel;
  @Input() skus: SkuAddonModel[];

  @Output() changeSelectedAddon = new EventEmitter<PurchaseAddonModel>();

  displayedColumns: string[] = ['quantity', 'item', 'price'];

  constructor(private router: Router) {}

  ngOnInit() {}

  getDomainPrice(item: SaleModel) {
    if (item) {
      let result = item.domainPrice.find((item: PriceModel) => {
        return item.currency == this.organization.currencyCode;
      });
      return result ? result.amount : 0;
    }
    return 0;
  }

  getAddonPrice(skuAddon: SkuAddonModel) {
    return Math.round(skuAddon.price * skuAddon.sku.quota * 1000) / 1000;
  }

  increaseSkuQuota(item: SkuAddonModel, quota: number) {
    if (!item.sku.saleModelCode) {
      return;
    }
    if (!(item.sku.quota == 0 && quota == -1)) {
      item.sku.quota += quota;
      if (
        !item.sku.saleModelCode ||
        item.sku.saleModelCode != this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code
      ) {
        try {
          let temp = this.purchaseSelectPlan.selectedPlan.saleModel.find((saleModel: PurchaseProductSkuSaleModel) => {
            return saleModel.code == item.skuDetail.saleModel[0].code;
          });
          if (!temp) {
            this.router.navigate(['purchase', 'step-fail'], {
              state: { msg: 'Sorry, an error has occurred when we try to fulfill your request. Please try again.' }
            });
          } else {
          }
        } catch (exception) {
          this.router.navigate(['purchase', 'step-fail'], {
            state: {
              msg: 'Sorry, an error has occurred when we try to fulfill your request. Please contact sales for details.'
            }
          });
        }
      }
      this.updateSelectedAddon();
    }
  }

  updateSelectedAddon() {
    setTimeout(() => {
      this.selectedAddon.skus = [];
      this.skus.forEach((item: SkuAddonModel) => {
        this.selectedAddon.skus.push(item.sku);
      });
      this.selectedAddon.totalPrice = this.getTotalPrice();

      this.changeSelectedAddon.emit(this.selectedAddon);
    }, 0);
  }

  getTotalPrice() {
    let skuAddonPrice = this.skus
      .map((item: SkuAddonModel) => {
        return item.price * item.sku.quota;
      })
      .reduce((total, num) => {
        return total + num;
      }, 0);
    return Math.round(skuAddonPrice * 1000) / 1000;
  }
}

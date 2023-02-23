import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Bundle } from '@b3networks/api/license';
import { BillingCycle } from '@b3networks/api/salemodel';
import { GetPriceChangeReq, PriceChain, PricingService } from '@b3networks/api/store';
import { PurchaseInput } from '@b3networks/portal/shared';
import { NUMBER_PRODUCT_ID } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-bundle-detail',
  templateUrl: './bundle-detail.component.html',
  styleUrls: ['./bundle-detail.component.scss']
})
export class BundleDetailComponent {
  private _bundle: Bundle;

  isLoading: boolean;
  totalPrice: number;
  currency: string;
  billingCycle: BillingCycle;

  priceMap: HashMap<PriceChain> = {}; // key is sku
  isViewFull: boolean;

  @ViewChild('bundleCard', { static: true }) bundleCard: ElementRef;

  @Input() set bundle(b: Bundle) {
    this._bundle = b;
    if (b) {
      // get pricing
      this._bundleChanged();
    }
  }

  get bundle() {
    return this._bundle;
  }

  constructor(private pricingService: PricingService, private router: Router) {}

  get isOverFlow() {
    return !!this.bundleCard && this.bundleCard.nativeElement.scrollHeight > this.bundleCard.nativeElement.clientHeight;
  }

  purchase() {
    this.router.navigate(['purchase', <PurchaseInput>{ bundleId: this.bundle.id }]);
  }

  private _bundleChanged() {
    const bundleItems = this.bundle.items;
    this.billingCycle = this.bundle.items[0].saleModelCode;

    const streams = bundleItems.map(i => {
      const req = <GetPriceChangeReq>{ productCode: i.productId, sku: i.sku, saleModel: i.saleModelCode };
      if (!!i.numberSku) {
        req.productCode = NUMBER_PRODUCT_ID;
        req.sku = i.numberSku;
      }

      if (req.sku in this.priceMap) {
        return of(this.priceMap[req.sku]);
      }
      this.isLoading = true;
      return this.pricingService.getPriceChain(req).pipe(
        catchError(_ =>
          of(
            new PriceChain({
              currency: '',
              unitPriceTaxExcl: 0,
              discount: 0,
              effectiveDiscount: 0,
              taxRate: 0,
              productName: '',
              skuName: ''
            })
          )
        ),
        tap(pricing => {
          this.priceMap[req.sku] = pricing;
          if (!this.currency) {
            this.currency = pricing.currency;
          }
        }),
        finalize(() => (this.isLoading = false))
      );
    });

    forkJoin(streams).subscribe(_ => {
      this.totalPrice = this.bundle.items
        .map(i => {
          const sku = !!i.numberSku ? i.numberSku : i.sku;
          const amount = this.priceMap[sku].finalPrice;
          return amount * i.quantity;
        })
        .reduce((a, b) => a + b, 0);
    });
  }

  toggleViewFull() {
    this.isViewFull = !this.isViewFull;
  }

  parseBillingCycle() {
    return this.billingCycle === 'monthly' ? 'per month' : 'per year';
  }
}

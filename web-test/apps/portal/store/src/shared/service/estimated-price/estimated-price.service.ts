import { Injectable } from '@angular/core';
import { App, AppService } from '@b3networks/api/app';
import { GeoService, OrganizationService } from '@b3networks/api/auth';
import { NumberService } from '@b3networks/api/number';
import { Product, ProductService } from '@b3networks/api/store';
import { X } from '@b3networks/shared/common';
import { forkJoin, of } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { EstimatedNumberSkuPrice, EstimatedPrice, EstimatedPrimarySkuPrice } from './estimated-price.model';

const numberType = 'NUMBER';

@Injectable({
  providedIn: 'root'
})
export class EstimatedPriceService {
  constructor(
    private orgService: OrganizationService,
    private appService: AppService,
    private numberService: NumberService,
    private geoService: GeoService,
    private productService: ProductService
  ) {}

  getEstimatePrice(productId: string, currency: string, type = 'APP') {
    const ob =
      type === 'APP'
        ? forkJoin([this.productService.getProductDetail(productId, currency), this.appService.getApp(productId)])
        : forkJoin([this.productService.getProductDetail(productId, currency), of(new App())]);

    return ob.pipe(
      flatMap(data => {
        const estimatedPrice: EstimatedPrice = new EstimatedPrice(productId, currency);
        if (!data[0].smallestSubscriptionCycle) {
          return of(estimatedPrice);
        }

        const product: Product = data[0];
        estimatedPrice.salesModelCode = product.smallestSubscriptionCycle;

        product.primarySkus
          .filter(sku => sku.subscriptionLestedCycleSupport === estimatedPrice.salesModelCode)
          .sort(
            (a, b) => a.getTotalCount(estimatedPrice.salesModelCode) - b.getTotalCount(estimatedPrice.salesModelCode)
          );
        estimatedPrice.skuPrices.push(
          new EstimatedPrimarySkuPrice(
            product.primarySkus[0].code,
            product.primarySkus[0].name,
            product.primarySkus[0].getTotalCount(estimatedPrice.salesModelCode)
          )
        );

        if (type === 'APP' && data[1].requiredNumber()) {
          return this.estimateNumberPrice(estimatedPrice, data[1].voiceMode, currency);
        }

        return of(estimatedPrice);
      })
    );
  }

  private estimateNumberPrice(estimatedPrice: EstimatedPrice, voiceMode: any, currency: string) {
    return this.productService.fetchProducts(numberType).pipe(
      flatMap(products => {
        let numberSkusOb = of([]);
        if (products.length > 0) {
          numberSkusOb = forkJoin([
            this.orgService.getOrganizationByUuid(X.orgUuid),
            this.productService.getProductDetail(products[0].productId, currency),
            this.numberService.fetchPricingCodes(products[0].productId, voiceMode.toString()),
            this.geoService.getGeoInfo({ forceLoad: true })
          ]);
        }
        return numberSkusOb;
      }),
      map(data => {
        if (data.length === 0) {
          return null;
        }

        const numberSupportedSkus: any[] = [];
        data[2].forEach(element => {
          const sku = data[1].skus.find(s => s.code === element);
          if (sku) {
            numberSupportedSkus.push(sku);
          }
        });
        const countryCode = data[0] != null ? data[0].countryCode : data[3].countryCode;
        let filteredSkus = numberSupportedSkus.filter(sku => sku.code.indexOf(countryCode) !== -1);
        if (filteredSkus.length === 0) {
          filteredSkus = numberSupportedSkus;
        }
        filteredSkus
          .filter(sku => sku.subscriptionLestedCycleSupport === estimatedPrice.salesModelCode)
          .sort(
            (a, b) => a.getTotalCount(estimatedPrice.salesModelCode) - b.getTotalCount(estimatedPrice.salesModelCode)
          );
        const estimatedNumberPrice = new EstimatedNumberSkuPrice(
          filteredSkus[0].code,
          filteredSkus[0].name,
          filteredSkus[0].getTotalCount(estimatedPrice.salesModelCode)
        );
        estimatedPrice.skuPrices.push(estimatedNumberPrice);
        return estimatedPrice;
      })
    );
  }
}

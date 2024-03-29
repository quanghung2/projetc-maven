import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GetPriceChangeReq {
  productCode: string;
  sku: string;
  saleModel: string;
}

// Generated by https://quicktype.io

export class PriceChain {
  currency: string;
  unitPriceTaxExcl: number;
  discount: number;
  effectiveDiscount: number;
  taxRate: number;
  sellerUuid: string;
  standaloneInvoiceTextTemplate: string;
  sellerCost: PriceChain;
  productName: string;
  skuName: string;
  addonInvoiceTextTemplate: string;

  // finalPrice: number;

  constructor(obj?: Partial<PriceChain>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get unitPrice() {
    return this.taxRate ? this.taxRate + this.unitPriceTaxExcl : this.unitPriceTaxExcl;
  }

  get finalPrice() {
    return (this.unitPriceTaxExcl - this.effectiveDiscount) * (1 + this.taxRate);
  }

  getRealPrice(): number {
    const temp =
      this.unitPriceTaxExcl < this.discount ? 0 : (this.unitPriceTaxExcl - this.discount) * (1 + this.taxRate);
    return Math.round(temp * 1000) / 1000;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  constructor(private http: HttpClient) {}

  /**
   *
   * @param req
   * @param promotedOrgUuid use after promote API
   * @returns
   */
  getPriceChain(req: GetPriceChangeReq, promotedOrgUuid?: string): Observable<PriceChain> {
    let headers = new HttpHeaders();
    if (!!promotedOrgUuid) {
      headers = headers.set(X_B3_HEADER.orgUuid, promotedOrgUuid);
    }
    return this.http
      .get<PriceChain>(
        `store/private/v3/utility/products/${req.productCode}/skus/${req.sku}/salemodels/${req.saleModel}/chain`,
        { headers: headers }
      )
      .pipe(map(price => new PriceChain(price)));
  }
}

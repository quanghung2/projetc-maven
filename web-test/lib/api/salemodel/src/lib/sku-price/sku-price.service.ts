import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DNCSkuPrice, SkuPrice } from './sku-price.model';

@Injectable({
  providedIn: 'root'
})
export class SkuPriceService {
  constructor(private http: HttpClient) {}

  getProductSkuPrices(productId: string, sku: string): Observable<SkuPrice[]> {
    return this.http
      .get<SkuPrice[]>(`sale-model/private/v3/products/${productId}/skus/${sku}/prices`)
      .pipe(map(list => list.map(i => new SkuPrice(i))));
  }

  getDNCSkuPrices(currencyCode: string, domain: string) {
    const params = new HttpParams().append('currency', currencyCode).append('domain', domain);
    return this.http.get<DNCSkuPrice>(`sale-model/private/v1/products/dnc_lookup/skus/dnc_lookup/domainpricelist`, {
      params: params
    });
  }
}

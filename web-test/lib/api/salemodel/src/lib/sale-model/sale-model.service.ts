import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RealDomain, RealDomainService } from '@b3networks/api/auth';
import { Sku } from '@b3networks/api/store';
import { Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { SaleModelResponse } from './sale-model.model';

@Injectable({
  providedIn: 'root'
})
export class SaleModelService {
  constructor(private http: HttpClient, private domainService: RealDomainService) {}

  getSaleModelDetail(domain: string, productId: string, currencyCode?: string): Observable<SaleModelResponse> {
    return this.http.get<SaleModelResponse>(
      `/sale-model/private/v1/products/${productId}/domainpricelist?page=0&size=1000&domain=${domain}${
        currencyCode ? `&currency=${currencyCode}` : ''
      }`
    );
  }

  fetchPricing(productId: string, currency: string): Observable<Sku[]> {
    return this.domainService.getRealDomainFromPortalDomain().pipe(
      mergeMap((realDomain: RealDomain) => {
        const url = `/sale-model/private/v1/products/${productId}/domainpricelist?domain=${realDomain.domain}&currency=${currency}&page=0&size=1000`;
        return this.http.get(url);
      }),
      map((res: any) => res.content),
      map(skuList => {
        const list: Sku[] = [];
        skuList.forEach(element => {
          const sku = Sku.buildFromSalesModelResponse(element);
          if (sku) {
            list.push(sku);
          }
        });
        return list;
      }),
      catchError(_ => of([]))
    );
  }
}

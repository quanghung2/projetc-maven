import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateProductSku, GetSkuReq, PriceChain, Sku } from '@b3networks/api/store';
import { ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SkuService {
  constructor(private http: HttpClient) {}

  getSku(domain, productId, sku: string): Observable<Sku> {
    return this.http
      .get<Sku>(`store/private/v1/domains/${domain}/products/${productId}/skus/${sku}`)
      .pipe(map(res => new Sku(res)));
  }

  fetchSkus(domain, request: GetSkuReq): Observable<Sku[]> {
    const params = new HttpParams().set('filter', request.filter);
    return this.http
      .get<Sku[]>(`store/private/v1/domains/${domain}/products/${request.productId}/skus`, {
        params: params
      })
      .pipe(map(list => list.map(sku => new Sku(sku))));
  }

  getProductSkus(productId: ID) {
    return this.http
      .get<Sku[]>(`/store/private/v2/app/products/${productId}/skus`)
      .pipe(map(list => list.map(i => new Sku(i))));
  }

  createProductSku(body: CreateProductSku, productId: ID) {
    return this.http.post<void>(`/store/private/v2/app/products/${productId}/skus`, body);
  }

  checkProductSku(productId: ID, sku: string) {
    return this.http.get<Sku[]>(`/store/private/v2/app/products/${productId}/skus/${sku}`);
  }

  getSaleModel(productId: string, skuCode: string, saleModelCode: string): Observable<PriceChain> {
    return this.http.get<PriceChain>(
      `/store/private/v2/utility/products/${productId}/skus/${skuCode}/salemodels/${saleModelCode}/chain`
    );
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { X } from '@b3networks/shared/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetSubscribedProductReq, SubscribedProduct } from './subscribed-product.model';

@Injectable({
  providedIn: 'root'
})
export class SubscribedProductService {
  constructor(private http: HttpClient) {}

  getSubscribedProducts(subscribedProductReq: GetSubscribedProductReq): Observable<SubscribedProduct> {
    const query = new HttpParams()
      .set('includeAll', String(subscribedProductReq.includeAll))
      .set('assigneed', subscribedProductReq.assigneed)
      .set('subscriptionStatus', subscribedProductReq.subscriptionStatus);
    return this.http
      .get<SubscribedProduct>(`/subscription/private/v3/subscribedproducts`, { params: query })
      .pipe(map(res => new SubscribedProduct(res)));
  }

  buySubscribe(body) {
    return this.http.post<SubscribedProduct>(`/subscription/private/v3/subscribe`, body);
  }

  canSubscribeTrial(productId: string): Observable<any> {
    if (!X.sessionToken) {
      return of({ trial: false });
    }
    return this.http.get(`/subscription/private/v3/subscribe/trial?productId=${productId}`);
  }
}

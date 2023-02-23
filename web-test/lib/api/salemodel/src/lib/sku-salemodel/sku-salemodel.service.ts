import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SkuSalemodelService {
  constructor(private http: HttpClient) {}

  createProductSkuSaleModel(productId: string, sku: string) {
    let body = {
      saleModel: 'usage',
      description: 'Usage charge',
      type: 'ONE_OFF'
    };
    return this.http.post(`sale-model/private/v3/products/${productId}/skus/${sku}/salemodels`, body);
  }
}

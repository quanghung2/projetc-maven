import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OrderRequest } from './order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) {}

  purchaseOrder(orderRequest: OrderRequest) {
    return this.http.post(`/order/private/v1/orders`, orderRequest);
  }
}

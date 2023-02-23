import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  constructor(private http: HttpClient) {}

  getLast100Transactions(sellerUuid: string, buyerUuid: string, currency: string) {
    const params = new HttpParams().set('page', '1').set('perPage', '100');
    return this.http.get(`/data/private/billingHistory/${sellerUuid}/${buyerUuid}/${currency}`, {
      params: params
    });
  }
}

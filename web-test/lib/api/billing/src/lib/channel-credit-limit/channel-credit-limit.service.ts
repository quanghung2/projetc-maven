import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UpdateCreditLimitReq } from './channel-credit-limit.model';

@Injectable({
  providedIn: 'root'
})
export class ChannelCreditLimitService {
  constructor(private http: HttpClient) {}

  updateCreditLimit(req: UpdateCreditLimitReq) {
    return this.http.post(`/billing/private/v6/creditLimit`, req);
  }
}

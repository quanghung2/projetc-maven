import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SellerConfig } from '../models/seller-config.interface';

@Injectable({
  providedIn: 'root'
})
export class SellerConfigService {
  constructor(private httpClient: HttpClient) {}

  getSellerConfig(): Observable<SellerConfig> {
    return this.httpClient.get<SellerConfig>('/subscription/private/v4/seller-config');
  }

  updateSellerConfig(sellerConfig: SellerConfig) {
    return this.httpClient.put<SellerConfig>('/subscription/private/v4/seller-config', sellerConfig);
  }
}

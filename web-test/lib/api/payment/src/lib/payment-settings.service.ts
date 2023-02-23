import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentSettingsService {
  constructor(private http: HttpClient) {}

  getDomainGatewaySettings(gatewayCode: string, usingBaseFallback: boolean = true): Observable<DomainGatewaySettings> {
    return this.http.get<DomainGatewaySettings>(`payment/private/v2/gateways/${gatewayCode}/domain-settings`, {
      params: { usingBaseFallback: String(usingBaseFallback) }
    });
  }
}

export interface DomainGatewaySettings {
  usingOwnAccount: boolean;
  publicKey: string;
}

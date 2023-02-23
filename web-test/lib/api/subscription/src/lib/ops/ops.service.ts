import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RenewalConfig } from './ops.model';

@Injectable({
  providedIn: 'root'
})
export class RenewalConfigService {
  constructor(private http: HttpClient) {}

  getRenewalConfigs() {
    return this.http.get<RenewalConfig[]>(`/subscription/private/ops/renewalConfigs`);
  }

  updateRenewalConfig(renewalConfig: RenewalConfig) {
    return this.http.put(`/subscription/private/ops/renewalConfigs`, renewalConfig);
  }
}

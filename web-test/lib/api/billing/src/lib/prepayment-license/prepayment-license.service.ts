import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PrepaymentLicense } from './prepayment-license.model';

@Injectable({
  providedIn: 'root'
})
export class PrepaymentLicenseService {
  constructor(private http: HttpClient) {}

  getPrepaymentLicence(domain: string) {
    return this.http.get<PrepaymentLicense>(`/billing/private/b3Admin/v1/prepaymentLicence/${domain}`);
  }

  updatePrepaymentLicence(domain: string, body: PrepaymentLicense) {
    return this.http.put(`/billing/private/b3Admin/v1/prepaymentLicence/${domain}`, body);
  }
}

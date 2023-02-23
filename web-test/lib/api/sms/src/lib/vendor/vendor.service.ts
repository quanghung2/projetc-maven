import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Vendor } from './vendor.model';

@Injectable({ providedIn: 'root' })
export class VendorService {
  constructor(private http: HttpClient) {}

  getVendorCodes() {
    return this.http.get<string[]>(`sms/private/v1/vendors/codes`);
  }

  getVendors() {
    return this.http.get<Vendor[]>(`sms-gateway/private/v1/vendors`);
  }

  createVendor(body: Partial<Vendor>, code: string) {
    return this.http.post<Partial<Vendor>>(`sms-gateway/private/v1/vendors/${code}`, body);
  }

  updateVendor(body: Partial<Vendor>, code: string, name: string) {
    return this.http.put<Partial<Vendor>>(`sms-gateway/private/v1/vendors/${code}/${name}`, body);
  }

  disableVendor(code: string, name: string) {
    return this.http.post(`sms-gateway/private/v1/vendors/${code}/${name}/disable`, null);
  }

  enableVendor(code: string, name: string) {
    return this.http.post(`sms-gateway/private/v1/vendors/${code}/${name}/enable`, null);
  }
}

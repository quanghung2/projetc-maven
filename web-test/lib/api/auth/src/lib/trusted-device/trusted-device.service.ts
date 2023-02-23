import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TrustedDeviceInfo } from './trusted-device';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrustedDeviceService {
  constructor(private http: HttpClient) {}

  getTrustedDevices(page: number, perPage: number): Observable<TrustedDeviceInfo[]> {
    return this.http.get<TrustedDeviceInfo[]>(`/auth/private/v1/browsers?page=${page}&perPage=${perPage}`);
  }

  revokeDevice(deviceUuid) {
    return this.http.delete(`/auth/private/v1/browsers/${deviceUuid}`);
  }
}

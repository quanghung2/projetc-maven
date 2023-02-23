import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { DeviceAccessToken, DeviceOTP } from './devices.model';

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  constructor(private http: HttpClient) {}

  getDeviceId(domain?: string) {
    let params = new HttpParams();

    if (domain) {
      params = params.set('portal', domain);
    }

    return this.http
      .get<{ deviceId: string }>(`/auth/private/v2/devices/auth/tv/id`, { params })
      .pipe(map(res => res?.deviceId));
  }

  getDeviceOTP(deviceId: string) {
    return this.http.get<DeviceOTP>(`/auth/private/v2/devices/auth/tv/${deviceId}/codes`);
  }

  getDeviceAccessToken(deviceId: string, otpCode: string) {
    return this.http.get<DeviceAccessToken>(`/auth/private/v2/devices/auth/tv/${deviceId}/codes/${otpCode}`);
  }

  registerDevice(deviceId: string, otpCode: string) {
    return this.http.post(`/auth/private/v2/devices/tv/register`, { deviceId, appId: otpCode });
  }
}

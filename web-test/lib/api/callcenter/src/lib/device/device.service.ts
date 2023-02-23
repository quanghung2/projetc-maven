import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DeviceType } from '@b3networks/api/bizphone';
import { Observable } from 'rxjs';
import { Device, UpdateRegisteredDeviceReq } from './device.model';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  constructor(private http: HttpClient) {}

  getDevices(extKey: string): Observable<Device[]> {
    return this.http.get<Device[]>(`callcenter/private/v3/extension/${extKey}/device`);
  }

  getRegisteredMobileDevices(extKey: string): Observable<Device[]> {
    return this.http.get<Device[]>(`callcenter/private/v3/extension/${extKey}/devices/${DeviceType.MOBILE}/registered`);
  }

  updateDevice(req: UpdateRegisteredDeviceReq): Observable<void> {
    return this.http.put<void>(`callcenter/private/v3/extension/devices/info`, req);
  }

  resetSipPassword(
    identifier: { extKey: string; deviceType: DeviceType; sipUserName: string },
    req: { newPassword?: string }
  ) {
    return this.http.put(
      `callcenter/private/v3/extension/${identifier.extKey}/device/${identifier.deviceType}/${identifier.sipUserName}/resetPassword`,
      {
        newPassword: req.newPassword
      },
      {
        responseType: 'text'
      }
    );
  }
}

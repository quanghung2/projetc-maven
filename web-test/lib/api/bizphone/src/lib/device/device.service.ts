import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, finalize, mergeMap, tap } from 'rxjs/operators';
import { SIPAccount } from '../extension/model/device.model';
import { AutoProvisionJob, Device } from './device.model';
import { DeviceStore } from './device.store';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  constructor(private deviceStore: DeviceStore, private http: HttpClient) {}

  get() {
    this.deviceStore.setLoading(true);
    return this.http.get<Device[]>(`callcenter/private/v2/device`).pipe(
      tap(entities => {
        this.deviceStore.setLoading(true);
        this.deviceStore.set(entities);
      })
    );
  }

  import(macAddresses: string[]) {
    return this.http.post<Device[]>('extension/private/device/import/ipphone', macAddresses).pipe(
      tap(res => {
        if (this.deviceStore.getValue().ids.length) {
          this.deviceStore.add(res);
        } else {
          this.deviceStore.set(res);
        }
      })
    );
  }

  updateDevice(device: Device) {
    return this.http.put<Device>(`callcenter/private/v2/device`, device).pipe(
      tap(_ => {
        this.deviceStore.upsert(device.id, device);
      })
    );
  }

  unassignExt(device: Device): Observable<void> {
    this.deviceStore.update({ isDeleting: true });

    return this.http.put<void>(`callcenter/private/v2/device/unassign/${device.id}`, {}).pipe(
      finalize(() => this.deviceStore.update({ isDeleting: false })),
      tap(_ => {
        this.deviceStore.upsert(device.id, { ...device, ext: '', extLabel: null, extType: null });
      })
    );
  }

  autoProvision() {
    this.deviceStore.update({ isAutoProvisioning: true });

    return this.http.post<{ action_id: number }>('callcenter/private/v2/device/autoprovision', {}).pipe(
      mergeMap(res => {
        if (res.action_id) {
          return this.checkAutoProvisionStatus(res.action_id, 1);
        } else {
          this.deviceStore.update({ isAutoProvisioning: false });
          return of();
        }
      }),
      catchError(e => {
        this.deviceStore.update({ isAutoProvisioning: false });
        return throwError(e);
      })
    );
  }

  private checkAutoProvisionStatus(actionId: number, tryNumber: number) {
    return this.http.get<AutoProvisionJob>(`extension/private/polling/${actionId}`).pipe(
      delay(3000),
      mergeMap(res => {
        switch (res.jobStatus) {
          case 'WAITING':
            if (tryNumber < 10) {
              return this.checkAutoProvisionStatus(actionId, tryNumber++);
            }
            this.deviceStore.update({ isAutoProvisioning: false });
            return throwError({ message: 'This process is still progressing. Please recheck after few minutes.' });
          case 'ERROR':
            this.deviceStore.update({ isAutoProvisioning: false });
            return throwError(res);
          default:
            this.deviceStore.update({ isAutoProvisioning: false });
            return of(res);
        }
      })
    );
  }

  resetSipPassword(sipDomain: string, sipUsername: string) {
    return this.http.put<SIPAccount>(`extension/private/sip`, {
      sipDomain: sipDomain,
      sipUsername: sipUsername
    });
  }
}

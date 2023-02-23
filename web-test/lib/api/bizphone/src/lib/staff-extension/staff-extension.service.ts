import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { StaffExtension } from './staff-extension.model';
import { StaffExtensionStore } from './staff-extension.store';

@Injectable({ providedIn: 'root' })
export class StaffExtensionService {
  constructor(private store: StaffExtensionStore, private http: HttpClient) {}

  getStaffExtension(identityUuid: string) {
    return this.http.get<StaffExtension>(`/extension/private/staffs/${identityUuid}/extension`).pipe(
      map(res => new StaffExtension(res)),
      tap(
        res => {
          this.store.upsert(res.identityUuid, res, {
            baseClass: StaffExtension
          });
        },
        _ => {
          // staff not extension
          const staff = new StaffExtension({ identityUuid: identityUuid });
          this.store.upsert(staff.identityUuid, staff, {
            baseClass: StaffExtension
          });
        }
      )
    );
  }
}

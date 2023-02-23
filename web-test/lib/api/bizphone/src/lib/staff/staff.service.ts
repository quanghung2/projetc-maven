import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { tap } from 'rxjs/operators';
import { GetStaffReq, Staff } from './staff.model';
import { StaffStore } from './staff.store';

@Injectable({ providedIn: 'root' })
export class StaffService {
  constructor(private staffStore: StaffStore, private http: HttpClient) {}

  /**
   *
   * @param req
   * @param pageable start from page 0
   */
  get(req: GetStaffReq, pageable?: Pageable) {
    let params = new HttpParams();
    if (req) {
      Object.keys(req).forEach(key => {
        if ('identityUuids' === key && req.identityUuids && req.identityUuids.length) {
          params = params.set('identityUuids', req.identityUuids.join(','));
        } else if (req[key] != null && req[key] !== '') {
          params = params.set(key, req[key].toString());
        }
      });
    }
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    }
    return this.http
      .get<Staff[]>('callcenter/private/v3/staffs', { params })
      .pipe(
        tap(entities => {
          this.staffStore.set(entities);
        })
      );
  }
}

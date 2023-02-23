import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { BizPhoneConferenceRoom, BizphoneExt, BizphoneExtGroups } from './bizphone-ext';

@Injectable({
  providedIn: 'root'
})
export class BizphoneService {
  private bizPhoneExts: BizphoneExtResp;

  constructor(private http: HttpClient) {}

  findBizPhoneExtensions(): Observable<BizphoneExtResp> {
    if (this.bizPhoneExts) {
      return of(this.bizPhoneExts);
    }
    return this.http.get<BizphoneExtResp>(`workflow/private/v1/bizphone`).pipe(
      map(res => {
        this.bizPhoneExts = new BizphoneExtResp(res);
        return this.bizPhoneExts;
      })
    );
  }
}

export class BizphoneExtResp {
  extensions: BizphoneExt[];
  extension_groups: BizphoneExtGroups[];
  conference_rooms: BizPhoneConferenceRoom[];
  constructor(obj?: any) {
    Object.assign(this, obj);
    if ('extensions' in obj) {
      this.extensions = obj['extensions'].map(ext => new BizphoneExt(ext));
    }
  }
}

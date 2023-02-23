import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class CalleridRemarkService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<CalleridRemark[]>('/appsip/callerIdRemarks');
  }

  import(tempKey: string) {
    return this.http.post('/appsip/callerIdRemarks/_import', {
      tempKey: tempKey
    });
  }

  update(remark: CalleridRemark) {
    return this.http.put(`/appsip/callerIdRemarks/${remark.callerId}`, {
      remark: remark.remark
    });
  }

  delete(callerId: string) {
    return this.http.delete(`/appsip/callerIdRemarks/${callerId}`);
  }
}

export class CalleridRemark {
  orgUuid: string;
  callerId: string;
  remark: Map<string, any>;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

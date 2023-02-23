import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ToggleB3worksModeReq {
  orgUuid: string;
  identityUuid: string;
  enabled: boolean;
}

export interface SipConcurrentCall {
  sipUsername: string;
  action: string;
  data: {
    concurrentCall: number;
  };
}

export interface SipOutgoingConcurrentCall {
  concurrentCallLimit: number;
  sipUsername: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtherService {
  constructor(private http: HttpClient) {}

  toggleB3worksMode(req: ToggleB3worksModeReq): Observable<void> {
    return this.http.put<void>(`notification/private/v1/uw/admin_cfg/toggle`, req);
  }

  reconciliationTrace(txnUuid: string): Observable<Blob> {
    const params = new HttpParams().set('txnUuid', txnUuid);
    return this.http.get(`reconciliation/api/v1/private/trace`, {
      params: params,
      responseType: 'blob'
    });
  }

  getConcurrentCall(sipUserName: string): Observable<SipOutgoingConcurrentCall> {
    return this.http.get<SipOutgoingConcurrentCall>(`/call/private/v1/config/outgoing?sipUsername=` + sipUserName);
  }

  updateConcurrentCall(req: SipConcurrentCall): Observable<void> {
    return this.http.put<void>(`/call/private/v1/config/outgoing`, req);
  }
}

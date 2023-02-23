import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

declare type LogType = 'info' | 'error' | 'debug';

export interface SendLogReq {
  type: LogType;
  source: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  constructor(private http: HttpClient) {}

  sendLog(req: SendLogReq) {
    return this.http.post(`/portal/private/v1/logs`, req);
  }

  logPaymentError(error: any) {
    return this.http.post<void>(`payment/private/v3/logError`, error);
  }
}

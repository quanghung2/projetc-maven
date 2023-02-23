import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface LogsReq {
  key: string;
}

export interface LogsRes {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppLogsService {
  constructor(private http: HttpClient) {}

  getLogs(req: LogsReq): Observable<LogsRes> {
    return this.http.post<LogsRes>(`/gatekeeper-management/private/v1/appLogs/presign`, req);
  }
}

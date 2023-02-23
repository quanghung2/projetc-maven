import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateServerReq,
  RoutingPlan,
  RoutingPlanRes,
  Seller,
  SettingHealthCheck,
  StatusHealthCheck
} from './cp.model';

@Injectable({
  providedIn: 'root'
})
export class CpService {
  constructor(private http: HttpClient) {}

  getSeller(uuid: string): Observable<Seller> {
    return this.http.get<Seller>(`cp/private/supplier/${uuid}`);
  }

  getPlan(plan: string): Observable<RoutingPlan[]> {
    return this.http.get<RoutingPlanRes>(`cp/private/routing-plan/${plan}`).pipe(map(res => res.data));
  }

  createServer(req: CreateServerReq) {
    return this.http.post<void>('cp/private/edge/provision', req);
  }

  getStatus(): Observable<StatusHealthCheck[]> {
    return this.http
      .get<StatusHealthCheck[]>(`cp/private/mshealthcheck/v1/status`)
      .pipe(map(statuses => statuses.map(status => new StatusHealthCheck(status))));
  }

  getSetting(): Observable<SettingHealthCheck[]> {
    return this.http.get<SettingHealthCheck[]>(`cp/private/mshealthcheck/v1/settings`);
  }

  setSetting(req: SettingHealthCheck): Observable<SettingHealthCheck[]> {
    return this.http.post<SettingHealthCheck[]>(`cp/private/mshealthcheck/v1/settings`, [req]);
  }
}

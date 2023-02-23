import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Compliance, StatusDncCompliance } from './compliance';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<Compliance>(`dnc/api/v2/private/compliance`);
  }

  getStatusDncCompliance(orgUuid: string) {
    return this.http.get<StatusDncCompliance>(`dnc/private/v3/compliance/${orgUuid}`);
  }

  updateDncCompliance(orgUuid: string, req: { callerIdExclusions: string[] }) {
    return this.http.put<void>(`dnc/private/v3/compliance/${orgUuid}`, req);
  }

  deleteDncCompliance(orgUuid: string) {
    return this.http.delete<void>(`dnc/private/v3/compliance/${orgUuid}`);
  }
}

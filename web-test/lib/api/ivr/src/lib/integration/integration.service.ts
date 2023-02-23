import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Integration } from './integration';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  constructor(private http: HttpClient) {}

  getIntegrationSettings(workflowUuid: string): Observable<Integration> {
    return this.http
      .get<Integration>(`workflow/private/v1/workflow/${workflowUuid}/integration`)
      .pipe(map(res => new Integration(res)));
  }

  updateIntegrationSettings(workflowUuid: string, integration: Integration): Observable<Integration> {
    return this.http
      .post<Integration>(`workflow/private/v1/workflow/${workflowUuid}/integration`, integration)
      .pipe(map(integration => new Integration(integration)));
  }

  deleteIntegrationSettings(workflowUUid: string): Observable<Integration> {
    return this.http
      .delete<Integration>(`workflow/private/v1/workflow/${workflowUUid}/integration`)
      .pipe(map(integration => new Integration(integration)));
  }

  getWebhookSettings(workflowUuid: string): Observable<Integration> {
    let params = {
      type: 'genericTicketing'
    };
    return this.http
      .get<Integration>(`workflow/private/v1/workflow/${workflowUuid}/integration`, { params: params })
      .pipe(map(res => new Integration(res)));
  }

  getHtppsNotificationSettings(workflowUuid: string): Observable<Integration> {
    let params = {
      type: 'httpOutgoing'
    };
    return this.http
      .get<Integration>(`workflow/private/v1/workflow/${workflowUuid}/integration`, { params: params })
      .pipe(map(res => new Integration(res)));
  }
}

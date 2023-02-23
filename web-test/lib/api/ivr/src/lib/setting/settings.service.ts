import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationSettingsResponse, PlaceholderSettingsResponse, SensitiveSettings, Setting } from './setting';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private http: HttpClient) {}

  public fetchSettings(flowUuid: string): Observable<any> {
    const params: any = {
      flow_uuid: flowUuid
    };
    return this.http.get<any>(`workflow/private/v1/settings`, { params });
  }

  public saveSettings(flowUuid: string, settings: Setting[]) {
    const params: any = {
      flowUuid: flowUuid,
      settings: settings
    };
    return this.http.post(`workflow/private/v1/settings`, params, {});
  }

  public fetchMissedCallNotificationSettings(worfklowUuid: string): Observable<NotificationSettingsResponse> {
    return this.http
      .get<NotificationSettingsResponse>(
        `workflow/private/v1/workflow/ivr/workflows/${worfklowUuid}/settings/notification`
      )
      .pipe(map(res => new NotificationSettingsResponse(res)));
  }

  public fetchPlaceholderSettings(workflowUuid: string): Observable<PlaceholderSettingsResponse> {
    return this.http
      .get<PlaceholderSettingsResponse>(
        `workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/settings/placeholder`
      )
      .pipe(map(res => new PlaceholderSettingsResponse(res)));
  }

  public saveAllSettings(workflowUuid: string, settings: any[]) {
    const body = {
      settings: settings
    };
    return this.http.post(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/settings`, body);
  }

  public getSensitiveSettings(workflowUuid: string): Observable<SensitiveSettings> {
    return this.http
      .get<SensitiveSettings>(`workflow/private/v1/workflow/ivr/workflows/${workflowUuid}/settings/sensitive`)
      .pipe(map(res => new SensitiveSettings(res)));
  }
}

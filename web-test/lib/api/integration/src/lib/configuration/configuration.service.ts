import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CodeSample, Webhook, WebhookLog } from './configuration.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  constructor(private http: HttpClient) {}

  fetchWebhooks(subUuid?: string): Observable<Webhook[]> {
    const strPath = subUuid ? `/${subUuid}` : '';
    return this.http.get<Webhook[]>(`/openapi/private/webhook${strPath}`);
  }

  fetchWebhookList() {
    return this.http.get<CodeSample[]>(`/openapi/private/webhookList2`);
  }

  register(config: Webhook, subUuid?: string) {
    const body = { url: config.url };
    const strPath = subUuid ? `/${subUuid}` : '';
    return this.http.put(`/openapi/private/webhook${strPath}/${config.code}`, body);
  }

  delete(code: string, subUuid?: string) {
    const strPath = subUuid ? `/${subUuid}` : '';
    return this.http.delete(`/openapi/private/webhook${strPath}/${code}`);
  }

  getLogWebhook(subUuid: string, code: string): Observable<WebhookLog[]> {
    return this.http.get<WebhookLog[]>(`/openapi/private/webhookLog/${subUuid}/${code}`);
  }
}

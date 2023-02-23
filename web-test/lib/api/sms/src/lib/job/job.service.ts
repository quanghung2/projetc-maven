import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ACTION, RecipientInfo, RespRecipientPhone } from './job.model';

@Injectable({
  providedIn: 'root'
})
export class SmsJobService {
  constructor(private http: HttpClient) {}

  sendSMS(body: RecipientInfo): Observable<RespRecipientPhone> {
    return this.http.post<RespRecipientPhone>('/sms/private/v1/job ', body);
  }

  getKeysBlacklist(): Observable<string[]> {
    return this.http.get<string[]>('/sms/private/v1/spam/keywords');
  }

  updateKeysBlacklist(keywords: string[], action: ACTION): Observable<void> {
    return this.http.put<void>('/sms/private/v1/spam/keywords/', { keywords, action });
  }

  getEnabledBlacklistKeys(domain: string): Observable<{ whitelistKeywords: string[] }> {
    return this.http.get<{ whitelistKeywords: string[] }>(`/sms/private/v1/spam/whitelists/domains/${domain}`);
  }

  updateEnabledBlacklistKeys(domain: string, keywords: string[]): Observable<void> {
    return this.http.put<void>(`/sms/private/v1/spam/whitelists/domains/${domain}`, { keywords });
  }
}

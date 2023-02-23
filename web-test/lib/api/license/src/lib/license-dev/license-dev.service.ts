import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiKeyLicense } from './license-dev.model';

@Injectable({
  providedIn: 'root'
})
export class LicenseDevService {
  constructor(private http: HttpClient) {}

  getApiKeys(): Observable<ApiKeyLicense[]> {
    return this.http.get<ApiKeyLicense[]>(`license/private/v1/apiKeys`);
  }

  getApiKeysBySubscriptionUuid(subscriptionUuid: string): Observable<ApiKeyLicense[]> {
    return this.http.get<ApiKeyLicense[]>(`license/private/v1/developerLicenses/${subscriptionUuid}/apiKeys`);
  }

  getAssignedNumbersBySubscriptionUuid(subscriptionUuid: string): Observable<string[]> {
    return this.http.get<string[]>(`license/private/v1/developerLicenses/${subscriptionUuid}/numbers`);
  }

  getConcurrentCallBySubscriptionUuid(subscriptionUuid: string): Observable<number> {
    return this.http.get<number>(`license/private/v1/developerLicenses/${subscriptionUuid}/concurrentCall`);
  }

  createApiKey(subscriptionUuid: string): Observable<ApiKeyLicense> {
    return this.http.post<ApiKeyLicense>(`license/private/v1/developerLicenses/${subscriptionUuid}/apiKeys`, {});
  }

  deleteApiKey(subscriptionUuid: string, apiKeyId: string): Observable<void> {
    return this.http.delete<void>(`license/private/v1/developerLicenses/${subscriptionUuid}/apiKeys/${apiKeyId}`);
  }
}

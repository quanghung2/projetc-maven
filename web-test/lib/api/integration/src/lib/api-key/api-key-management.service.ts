import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  APIKey,
  ApiLog,
  CreateApiKeyReq,
  CreateKeyResponse,
  DeveloperLicense,
  IpAddress,
  SecretApiKey,
  UpdateOrResetApiKeyReq,
  UpdateOrResetApiKeyResp
} from './api-key-management.model';
import { ApiKeyStore } from './api-key-management.store';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyManagementService {
  constructor(private http: HttpClient, private store: ApiKeyStore) {}

  getSecret(): Observable<SecretApiKey[]> {
    return this.http.get<SecretApiKey[]>('/openapi/private/secret');
  }
  createKey(label: string): Observable<CreateKeyResponse> {
    return this.http.post<CreateKeyResponse>('/openapi/private/secret', { label: label });
  }

  deleteKey(id: number) {
    return this.http.delete(`/openapi/private/secret/${id}`);
  }

  getDeveloperLicenses(): Observable<DeveloperLicense[]> {
    return this.http.get<DeveloperLicense[]>(`openapi/private/v1/developerLicence`);
  }

  createApiKey(req: CreateApiKeyReq): Observable<void> {
    return this.http.post<void>(`/openapi/private/v1/apikey`, req);
  }

  getAssignedApiKey(apiKeyId: number): Observable<APIKey> {
    return !apiKeyId
      ? of(null).pipe(tap(_ => this.store.update({ apiKey: null })))
      : this.http.get<APIKey>(`/openapi/private/v1/apikey/${apiKeyId}`).pipe(
          map(key => new APIKey(key)),
          tap(apiKey => {
            this.store.update({ apiKey: apiKey });
          })
        );
  }

  updateOrResetApiKey(apiKeyId: number, req: UpdateOrResetApiKeyReq): Observable<UpdateOrResetApiKeyResp> {
    return this.http.put<UpdateOrResetApiKeyResp>(`/openapi/private/v1/apikey/${apiKeyId}`, req);
  }

  deleteApiKey(apiKeyId: number) {
    return this.http.delete(`/openapi/private/v1/apikey/${apiKeyId}`);
  }

  getApiKeys(): Observable<APIKey[]> {
    return this.http.get<APIKey[]>(`/openapi/private/v1/apikey`);
  }

  getLogApi(apiKeyId: number): Observable<ApiLog[]> {
    return this.http.get<ApiLog[]>(`/openapi/private/apiLog/${apiKeyId}`);
  }

  getListIpAddressByApiKeyId(apiKeyId: number): Observable<IpAddress[]> {
    return this.http
      .get<string[]>(`/openapi/private/v2/ipWhitelist/${apiKeyId}`)
      .pipe(map((list: string[]) => list.map(ip => <IpAddress>{ ipAddress: ip })));
  }

  addSingleIpToWhiteList(apiKeyId: number, ipAddress: string): Observable<void> {
    return this.http.put<void>(`/openapi/private/v2/ipWhitelist/${apiKeyId}/${ipAddress}`, {});
  }

  deleteIpWhiteList(apiKeyId: number, ipAddress: string): Observable<void> {
    return this.http.delete<void>(`/openapi/private/v2/ipWhitelist/${apiKeyId}/${ipAddress}`);
  }
}

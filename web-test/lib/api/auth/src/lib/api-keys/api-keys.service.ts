import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiKey, ApiKeyStatus } from './api-keys.model';

@Injectable({
  providedIn: 'root'
})
export class ApiKeysService {
  constructor(private http: HttpClient) {}

  fetchAll(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(`auth/private/v1/apikeys`).pipe(map(list => list.map(key => new ApiKey(key))));
  }

  create() {
    return this.http.post(`auth/private/v1/apikeys`, {});
  }

  disable(apiKey: string) {
    return this.http.put(`auth/private/v1/apikeys/${apiKey}`, { status: ApiKeyStatus.DISABLED });
  }

  activate(apiKey: string) {
    return this.http.put(`auth/private/v1/apikeys/${apiKey}`, { status: ApiKeyStatus.ACTIVE });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { reqCASConfig, ResCASConfig } from './cas-config.model';

@Injectable({
  providedIn: 'root'
})
export class CASConfigService {
  constructor(private http: HttpClient) {}

  getConfig(module: string): Observable<ResCASConfig> {
    return this.http.get<ResCASConfig>(`/cas/${module}`);
  }

  updateConfig(module: string, payload: ResCASConfig): Observable<reqCASConfig> {
    return this.http.post<reqCASConfig>(`/cas/${module}`, payload);
  }
}

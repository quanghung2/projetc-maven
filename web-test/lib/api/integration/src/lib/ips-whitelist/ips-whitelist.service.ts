import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPWhiteList } from './ips-whitelist.model';

@Injectable({
  providedIn: 'root'
})
export class IpsWhitelistService {
  constructor(private http: HttpClient) {}

  fetchAll(): Observable<IPWhiteList[]> {
    return this.http.get<IPWhiteList[]>(`openapi/private/v1/ipWhitelist`);
  }

  add(req: IPWhiteList): Observable<void> {
    return this.http.put<void>(`openapi/private/v1/ipWhitelist`, req);
  }

  delete(req: IPWhiteList): Observable<void> {
    return this.http.request<void>('DELETE', `openapi/private/v1/ipWhitelist`, { body: req });
  }
}

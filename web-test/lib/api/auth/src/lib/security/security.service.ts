import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SecurityCompliance, SecurityPolicy, SecurityPolicyDetail } from './security';
import { SecurityComplianceStore } from './security.store';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  constructor(private http: HttpClient, private store: SecurityComplianceStore) {}

  getSecurityCompliance(): Observable<SecurityCompliance> {
    return this.http
      .get<SecurityCompliance>('/auth/private/v1/security/compliance')
      .pipe(tap(res => this.store.update(res)));
  }

  getSecurityPolicy(pageable: Pageable): Observable<Page<SecurityPolicyDetail>> {
    let params = new HttpParams();
    params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    return this.http
      .get<SecurityPolicyDetail[]>(`auth/private/v1/security/policy/all`, { params: params, observe: 'response' })
      .pipe(
        map(resp => {
          const content = resp.body.map(x => new SecurityPolicyDetail(x));
          const totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return {
            totalCount: totalCount,
            content: content
          } as Page<SecurityPolicyDetail>;
        })
      );
  }

  updateSecurityPolicy(data: SecurityPolicy, domainKey: string): Observable<void> {
    return this.http.put<void>(`auth/private/v1/security/policy?domainKey=${domainKey}`, data);
  }
}

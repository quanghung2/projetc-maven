import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RealDomainService } from '@b3networks/api/auth';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { AdminApp, AdminApplication } from './admin-app.model';
import { Partner } from './partner.model';
import { PartnerStore } from './partner.store';

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  constructor(private http: HttpClient, private store: PartnerStore, private realDomainService: RealDomainService) {}

  /**
   * This API is public api and don't need session token for authentication
   * So should remove all old session when call this API for prevent check session from Zuul
   */
  getPartnerByDomain(addon?: { forceLoad?: boolean; domain?: string }): Observable<Partner> {
    const headers = new HttpHeaders().set(X_B3_HEADER.orgUuid, '').set(X_B3_HEADER.sessionToken, '');

    const req$ = this.realDomainService
      .getRealDomainFromPortalDomain()
      .pipe(
        mergeMap(domain => this.http.get<Partner>(`/partner/private/v1/domains/${domain.domain}`, { headers: headers }))
      )
      .pipe(
        map(res => new Partner(res)),
        tap(data => {
          this.store.update(data);
          this.store.setHasCache(true);
        })
      );

    if (addon?.forceLoad) {
      return req$;
    }

    return cacheable(this.store, req$);
  }

  getPartnerWithDomain(domain: string): Observable<Partner> {
    const headers = new HttpHeaders().set(X_B3_HEADER.orgUuid, '').set(X_B3_HEADER.sessionToken, '');

    return this.http
      .get<Partner>(`/partner/private/v1/domains/${domain}`, { headers: headers })
      .pipe(map(res => new Partner(res)));
  }

  getAdminAppVisible(): Observable<AdminApplication[]> {
    return this.http.get<AdminApplication[]>(`/partner/private/v2/adminapps`, { params: { visible: 'true' } });
  }

  getPartnerNodes() {
    return this.http.get<Partner[]>(`/partner/private/v1/root/nodes`);
  }

  updateSupportedCurrencies(domain: string, supportedCurrencies: string[]) {
    return this.http.put(`/partner/cp/v1/domains/${domain}`, { supportedCurrencies });
  }

  getAdminApps() {
    return this.http.get<AdminApp[]>(`/partner/cp/v1/adminapps`);
  }

  storeAdminApps(body: AdminApp) {
    return this.http.put<AdminApp>(`/partner/cp/v1/adminapps`, body);
  }
}

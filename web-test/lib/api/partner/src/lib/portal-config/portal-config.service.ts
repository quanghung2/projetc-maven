import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RealDomainService } from '@b3networks/api/auth';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { PortalConfig } from './portal-config.model';
import { PortalConfigStore } from './portal-config.store';

@Injectable({
  providedIn: 'root'
})
export class PortalConfigService {
  constructor(
    private http: HttpClient,
    private store: PortalConfigStore,
    private realDomainService: RealDomainService
  ) {}

  /**
   * This API is public api and don't need session token for authentication
   * So should remove all old session when call this API for prevent check session from Zuul
   * NOTE - Use query to get config when this api can return EMPTY observable
   */
  getPortalConfig(addon?: { forceLoad: boolean }): Observable<PortalConfig> {
    const headers = new HttpHeaders().set(X_B3_HEADER.orgUuid, '').set(X_B3_HEADER.sessionToken, '');
    const req$ = this.realDomainService
      .getRealDomainFromPortalDomain()
      .pipe(
        mergeMap(domain =>
          this.http.get<PortalConfig>(`/partner/private/v1/domains/${domain.domain}/portalConfig`, { headers: headers })
        )
      )
      .pipe(
        map(res => new PortalConfig(res)),
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
}

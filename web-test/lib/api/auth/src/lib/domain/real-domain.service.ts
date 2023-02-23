import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { DomainUtilsService, X_B3_HEADER } from '@b3networks/shared/common';
import { of, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

export interface RealDomain {
  domain: string; // right domain
  portalDomain: string;
  publicKey: string | null;
  ssoIdPs?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RealDomainService implements OnDestroy {
  domain$ = new Subject<string>();
  destroy$ = new Subject<boolean>();

  domain: string;

  private _realDomain: RealDomain; // some partner changed domain from auth module. And need mapping to right domain when call ms-partner

  constructor(private http: HttpClient, private domainUtilService: DomainUtilsService) {
    this.domain$
      .pipe(
        takeUntil(this.destroy$),
        tap(domain => {
          this.domain = domain;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /**
   * This api does not need session to validation
   */
  getRealDomainFromPortalDomain() {
    const headers = new HttpHeaders().set(X_B3_HEADER.orgUuid, '').set(X_B3_HEADER.sessionToken, '');
    const domain = this.domain ?? this.domainUtilService.getPortalDomain();

    const request$ = this.http
      .get<RealDomain>(`/auth/private/v1/domains?domain=${domain}`, { headers: headers })
      .pipe(tap(realDomain => (this._realDomain = realDomain)));

    if (this.domain) {
      return request$;
    }

    if (this._realDomain) {
      return of(this._realDomain);
    } else {
      return request$;
    }
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MSUser, OAuthStatus, Record, Subscription } from './ms-team.model';

@Injectable({ providedIn: 'root' })
export class MsTeamAuthService {
  constructor(private http: HttpClient) {}

  getOAuthStatus(): Observable<OAuthStatus> {
    return this.http.get<OAuthStatus>('/auth/private/v1/ext/msTeams');
  }

  enable(redirectUrl: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>('/auth/private/v1/ext/msTeams/oauth2/url', {
      originUrl: redirectUrl
    });
  }

  getUsers(): Observable<string[]> {
    return this.http.get<{ users: MSUser[] }>('/auth/private/v1/ext/msTeams/users').pipe(
      map(res => {
        if (res.users) {
          return res.users.map(user => user.principalName);
        }

        return [];
      })
    );
  }

  /**
   *
   * @param domain from teamInfo.dnsTxtRecordKey
   */
  addDomain(domain: string): Observable<string> {
    return this.http
      .post<any>('/auth/private/v1/ext/msTeams/domains', {
        domain: domain
      })
      .pipe(
        map(res => {
          if (res && res.records) {
            const records: Record[] = res.records.filter(record => record.text);
            return records[0].text;
          }
          return null;
        }),
        catchError(err => {
          if (err?.message === 'failed to create DNS records') {
            return throwError(
              `Domain ${domain} is already existed. Please clean up it on your Microsoft Team portal and then try again`
            );
          }
          return throwError(err);
        })
      );
  }

  verifyDomain(domain: string) {
    return this.http
      .put<any>('/auth/private/v1/ext/msTeams/domains', {
        domain: domain
      })
      .pipe(
        map(response => {
          if (response?.error?.message && response.error.message.includes('MissingRecord')) {
            return of();
            // throw {
            //   message: 'Please wait a few minutes for this domain is being verified',
            //   code: 'MissingRecord'
            // };
          } else {
            throw new Error(response.error.message);
          }
        })
      );
  }

  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<{ skuId: string; skuPartNumber: string }[]>('/auth/private/v1/ext/msTeams/subscriptions');
  }

  assignDomainLicence(skuId: string, domain: string) {
    return this.http.put<any>('/auth/private/v1/ext/msTeams/subscriptions', {
      skuId: skuId,
      domain: domain
    });
  }

  revokeAccess(clientId: string) {
    return this.http.delete<any>(`/auth/private/v2/ext/msTeams?clientId=${clientId}`);
  }
}

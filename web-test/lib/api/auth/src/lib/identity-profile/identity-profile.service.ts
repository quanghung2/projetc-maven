import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Team } from '../team/team.model';
import { IdentityProfile, ProfileOrg } from './identity-profile.model';
import { IdentityProfileStore } from './identity-profile.store';

/**
 * Portal app using SessionService instead
 */
@Injectable({ providedIn: 'root' })
export class IdentityProfileService {
  constructor(private http: HttpClient, private store: IdentityProfileStore) {}

  /**
   * Get current profile
   */
  getProfile(): Observable<IdentityProfile> {
    return this.http
      .get<IdentityProfile>(`auth/private/v1/organizations/members`, {
        params: { page: '0', size: '1' }
      })
      .pipe(
        map(res => new IdentityProfile(res)),
        tap(profile => {
          this.store.update({
            profile: profile,
            currentOrg: profile.organizations.length === 1 ? profile.organizations[0] : null
          });
        })
      );
  }

  getTeams(identityUuid: string | null = null) {
    const params = identityUuid && { identityUuid };
    return this.http.get<Team[]>(`/auth/private/v1/organizations/teams`, { params }).pipe(
      map(res => res.filter(t => t.active)),
      tap(res => {
        this.store.update({ teams: res });
      })
    );
  }

  getAllBelongOrgs(): Observable<ProfileOrg[]> {
    const headers = new HttpHeaders().set(X_B3_HEADER.orgUuid, '');
    return this.http
      .get<IdentityProfile>(`auth/private/v1/organizations/members`, {
        headers: headers,
        params: { page: '0', size: '1000' }
      })
      .pipe(map(res => new IdentityProfile(res).organizations));
  }
}

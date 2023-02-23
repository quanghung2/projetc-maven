import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  AuthenticationGoogle,
  ExternalOAuth,
  GOOGLE_CLIENT_ID,
  MS_TEAM_CLIENT_ID,
  RespAuthenGoogle,
  ZOOM_CLIENT_ID
} from './oauth.model';
import { ExternalOAuthStore } from './oauth.store';

@Injectable({ providedIn: 'root' })
export class ExternalOAuthService {
  constructor(private http: HttpClient, private store: ExternalOAuthStore) {}

  //--- Zoom --//
  enableZoom(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>('/auth/private/v1/ext/zoom/oauth2/url', {
      originUrl: location.href,
      clientId: ZOOM_CLIENT_ID
    });
  }

  disconnectZoom() {
    return this.http.delete<{ url: string }>(`/auth/private/v1/ext/zoom`, { params: { clientId: ZOOM_CLIENT_ID } });
  }

  getZooms() {
    return this.http.get<ExternalOAuth[]>('/auth/private/v1/ext/zoom ');
  }

  //--- Ms Team V2 --//
  enableMsTeam(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>('/auth/private/v2/ext/msTeams/oauth2/url', {
      originUrl: location.href,
      clientId: MS_TEAM_CLIENT_ID
    });
  }

  disconnectMsTeam() {
    return this.http.delete<{ url: string }>(`/auth/private/v2/ext/msTeams`, {
      params: { clientId: MS_TEAM_CLIENT_ID }
    });
  }

  getmsTeams() {
    return this.http.get<ExternalOAuth[]>('/auth/private/v2/ext/msTeams');
  }

  //--- Google --//
  verifyLoginGoogle(req: AuthenticationGoogle) {
    return this.http.post<RespAuthenGoogle>('/auth/private/v1/ext/google/login/verify', req).pipe(
      tap(resp =>
        this.store.update({
          google: resp.profile,
          tokenSocial: resp.token
        })
      )
    );
  }

  signOutGoogle() {
    this.store.update({ google: null, tokenSocial: null });
  }

  enableGoogle(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>('/auth/private/v1/ext/google/oauth2/url/members', {
      originUrl: location.href,
      clientId: GOOGLE_CLIENT_ID
    });
  }

  disconnectGoogle() {
    return this.http.delete<{ url: string }>(`/auth/private/v1/ext/google/members`, {
      params: { clientId: GOOGLE_CLIENT_ID }
    });
  }

  getGoogles() {
    return this.http.get<ExternalOAuth[]>('/auth/private/v1/ext/google/members');
  }

  //--- Ms Team V2 --//
  enableMsTeamMember(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>('/auth/private/v2/ext/msTeams/oauth2/url/members', {
      originUrl: location.href,
      clientId: MS_TEAM_CLIENT_ID
    });
  }

  disconnectMsTeamMember() {
    return this.http.delete<{ url: string }>(`/auth/private/v2/ext/msTeams/members`, {
      params: { clientId: MS_TEAM_CLIENT_ID }
    });
  }

  getmsTeamsMember() {
    return this.http.get<ExternalOAuth[]>('/auth/private/v2/ext/msTeams/members');
  }
}

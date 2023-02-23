import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IdentityProfile,
  Login2FaRequest,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MemberRole,
  Organization,
  ProfileOrg,
  RefreshTokenReq,
  UpdatePersonalRequest,
  UpdatePersonalResponse
} from '@b3networks/api/auth';
import {
  buildUrlParameter,
  CookieService,
  DomainUtilsService,
  isLocalhost,
  LocalStorageUtil,
  X_B3_HEADER
} from '@b3networks/shared/common';
import { addSeconds, differenceInSeconds } from 'date-fns';
import { BehaviorSubject, firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { RememberMeData } from './session.model';
import {
  REFRESHING_TOKEN,
  REFRESHING_TOKEN_TIMEOUT,
  REMEMBER_ME_KEY,
  SessionState,
  SessionStore,
  SESSION_KEY,
  TRUSTED_BROWSER
} from './session.store';

const SESSION_TOKEN = 'sessionToken';

const TRUSTED_BROWSER_IN_MILLIS = 30 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SessionService {
  error$ = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient,
    private store: SessionStore,
    private cookie: CookieService,
    private domainUtils: DomainUtilsService
  ) {
    try {
      this._loadSession();
    } catch (error) {
      console.error(error);
    }
  }

  login(loginInfo: LoginRequest): Observable<LoginResponse> {
    loginInfo.trustedBrowser = LocalStorageUtil.getItem(TRUSTED_BROWSER);

    return this.http.post<LoginResponse>('/auth/private/v3/login', loginInfo).pipe(
      map(r => new LoginResponse(r)),
      tap(result => {
        if (!result.loginSession) {
          this._completeLogin(result);
        }
      })
    );
  }

  complete2faLogin(loginInfo: Login2FaRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/private/v3/login', loginInfo).pipe(
      tap(result => {
        this._completeLogin(result);
      })
    );
  }

  async refreshSession(): Promise<boolean> {
    console.log(`Refresh token...`);

    if (LocalStorageUtil.getItem(REFRESHING_TOKEN)) {
      console.log(`Refresing somewhere, wait ${REFRESHING_TOKEN_TIMEOUT / 1000}s then resume...`);

      await new Promise(function (re) {
        setTimeout(() => {
          re('anything');
        }, REFRESHING_TOKEN_TIMEOUT);
      });
    }

    let result = false;
    try {
      // call API to validate current state before call refresh token
      result = await firstValueFrom(this.checkSessionExpiry());
      if (result && differenceInSeconds(this.store.getValue().sessionExpipryAt, new Date()) > 15) {
        return result;
      }
    } catch (_) {
      // invalid session then need 2 refresh token
    }

    const rememberMe = LocalStorageUtil.getItem(REMEMBER_ME_KEY) as RememberMeData;
    if (rememberMe) {
      LocalStorageUtil.setItem(REFRESHING_TOKEN, true, REFRESHING_TOKEN_TIMEOUT); // set ttl to make sure not blocking

      try {
        const refreshResult: RememberMeData = await this.http
          .post<LoginResponse>(
            `/auth/private/v3/login`,
            <RefreshTokenReq>{
              loginId: rememberMe.loginId,
              seriesId: rememberMe.seriesId,
              domain: rememberMe.domain
            },
            { headers: new HttpHeaders().set(X_B3_HEADER.orgUuid, '') }
          )
          .toPromise();

        // to continue progess logged in state
        await this.checkSessionExpiry().toPromise();

        rememberMe.loginId = refreshResult.loginId;
        rememberMe.seriesId = refreshResult.seriesId;
        LocalStorageUtil.setItem(REMEMBER_ME_KEY, rememberMe);
        result = true;
      } catch (_) {
        const storingRemember = LocalStorageUtil.getItem(REMEMBER_ME_KEY) as RememberMeData;
        if (storingRemember && storingRemember.loginId === rememberMe.loginId) {
          this._cleanup();
        }
      }

      LocalStorageUtil.removeItem(REFRESHING_TOKEN);
    } else {
      this._cleanup();
    }

    return result;
  }

  logout(other: boolean = true): Observable<void> {
    let req = <LogoutRequest>{ other };
    const rememberMe = LocalStorageUtil.getItem(REMEMBER_ME_KEY) as RememberMeData;
    if (rememberMe) {
      req = <LogoutRequest>{
        ...req,
        loginId: rememberMe.loginId,
        seriesId: rememberMe.seriesId
      };
    }
    return this.http.post<void>('/auth/private/v2/logout', req).pipe(
      tap(_ => {
        this._cleanup();
      })
    );
  }

  checkSessionExpiry(): Observable<boolean> {
    return this.http.get(`/auth/private/v1/sessiontokens`, { observe: 'response' }).pipe(
      map(resp => {
        const expiryInSeconds = +resp.headers.get('x-session-expiry');
        const expiryAt = addSeconds(new Date(), expiryInSeconds);
        console.log(`Expiry within ${expiryInSeconds} seconds - at ${expiryAt}`);

        this.store.update({ sessionExpipryAt: expiryAt, validatedSession: true });
        return true;
      }),
      catchError(err => {
        const result = err.sec === 201 ? false : true;
        if (!result) {
          this.store.update({ sessionExpipryAt: null, validatedSession: true });
        }
        return of(result);
      })
    );
  }

  getProfile(currentOrgUuid?: string): Observable<IdentityProfile> {
    const headers = new HttpHeaders().set(X_B3_HEADER.orgUuid, '');
    return forkJoin([
      this.http
        .get<IdentityProfile>(`auth/private/v1/organizations/members`, {
          headers: headers,
          params: { page: '0', size: '1000' }
        })
        .pipe(map(profile => new IdentityProfile(profile))),
      this.http.get<Organization[]>(`auth/private/v1/organizations/serviced`).pipe(
        map(entities =>
          entities.map(
            o =>
              new ProfileOrg({
                orgUuid: o.uuid,
                orgName: o.name,
                orgShortName: o.shortName,
                logoUrl: o.logoUrl,
                role: MemberRole.SUPER_ADMIN,
                walletCurrencyCode: o.walletCurrencyCode,
                walletUuid: o.walletUuid,
                isPartner: o.isPartner,
                licenseEnabled: o.licenseEnabled,
                countryCode: o.countryCode,
                domain: o.domain,
                timezone: o.timezone,
                timeFormat: o.timeFormat,
                created_datetime: o.createdDateTime
              })
          )
        )
      )
    ]).pipe(
      tap(([profile, servicedOrgs]) => {
        const sessionState: Partial<SessionState> = {
          profile: profile,
          servicedOrgs: servicedOrgs
        };

        if (currentOrgUuid) {
          let currentOrg: ProfileOrg = profile.organizations.find(org => org.orgUuid === currentOrgUuid);

          if (!currentOrg && servicedOrgs.length) {
            currentOrg = servicedOrgs.find(org => org.orgUuid === currentOrgUuid);
          }

          if (!currentOrg && profile.organizations.length) {
            currentOrg = profile.organizations.find(org => !org.isPartner);
            currentOrg = currentOrg ? currentOrg : profile.organizations[0];
          }

          sessionState.currentOrg = currentOrg;
        }

        this.store.update(state => {
          return {
            ...state,
            ...sessionState
          };
        });
      }),
      map(([profile, _]) => profile)
    );
  }

  updatePersonalInfo(req: UpdatePersonalRequest): Observable<UpdatePersonalResponse> {
    return this.http.put<UpdatePersonalResponse>('/auth/private/v1/identities', req).pipe(
      tap(_ => {
        this.updateProfileStore(req);
      })
    );
  }

  updatePersonalNumber(number: string, token: string) {
    return this.http.post(`/auth/private/v1/identities/credentials/number/${number}?token=${token}`, {});
  }

  switchOrg(org: ProfileOrg) {
    console.log(`Update profile to new org ${org?.orgName}`);

    this.store.update(state => {
      return { ...state, currentOrg: org };
    });
  }

  private async _completeLogin(res: LoginResponse) {
    console.log(`Completed login flow...`);

    // Persist the remeif necessary
    if (res.loginId && res.seriesId) {
      const rememberMe = <RememberMeData>{
        loginId: res.loginId,
        seriesId: res.seriesId,
        domain: res.portalDomain
      };
      LocalStorageUtil.setItem(REMEMBER_ME_KEY, rememberMe);
    }

    if (res.trustedBrowserUuid) {
      LocalStorageUtil.setItem(TRUSTED_BROWSER, res.trustedBrowserUuid, TRUSTED_BROWSER_IN_MILLIS);
    }

    await this.checkSessionExpiry().toPromise();
  }

  private _cleanup() {
    LocalStorageUtil.removeItem(REMEMBER_ME_KEY);
    if (this.cookie.check('session')) {
      this.cookie.delete('session', null, this.domainUtils.getPortalDomain());
    }
    this.store.logout();
  }

  private updateProfileStore(payload: UpdatePersonalRequest) {
    const profile = new IdentityProfile(this.store.getValue().profile);
    if (payload.photoUrl) {
      profile.photoUrl = payload.photoUrl;
    }
    if (payload.givenName) {
      profile.givenName = payload.givenName;
    }
    if (payload.familyName) {
      profile.familyName = payload.familyName;
    }
    if (payload.displayName) {
      profile.displayName = payload.displayName;
    }
    if (payload.timezoneUuid) {
      profile.timezone = payload.timezoneUuid;
    }
    if (payload.mobileNumber) {
      profile.mobileNumber = payload.mobileNumber;
    }
    if (payload.email) {
      profile.email = payload.email;
    }
    profile.about = payload.about;

    this.store.update({ profile: profile });
  }

  private async _loadSession() {
    // login as session and this will be not update to cookie
    const queryParams = buildUrlParameter();
    if (queryParams[SESSION_TOKEN]) {
      const secure = isLocalhost() ? false : true;
      this.cookie.set(SESSION_KEY, queryParams[SESSION_TOKEN], null, null, this.domainUtils.getPortalDomain(), secure);
    }

    const session: { sessionToken } = this.cookie.getObj('session');
    if (session) {
      this.store.update({ fallbackSessionToken: session.sessionToken });

      //   if (!!session.sessionToken && !this.cookie.check(SESSION_TOKEN)) {
      //     const secure = isLocalhost() ? false : true;
      //     this.cookie.set(SESSION_KEY, session.sessionToken, null, null, this.domainUtils.getPortalDomain(), secure);
      //   }
      //   this.cookie.delete('session', null, this.domainUtils.getPortalDomain());
    }

    const trustedBrowser = this.cookie.get('trusted_browser_uuid');
    if (trustedBrowser) {
      if (!LocalStorageUtil.getItem(TRUSTED_BROWSER)) {
        LocalStorageUtil.setItem(TRUSTED_BROWSER, trustedBrowser, TRUSTED_BROWSER_IN_MILLIS);
      }
      this.cookie.delete('trusted_browser_uuid', null, this.domainUtils.getPortalDomain());
    }
    const rememberMe = this.cookie.getObj('remember_me');
    if (rememberMe != null) {
      if (!LocalStorageUtil.getItem(REMEMBER_ME_KEY)) {
        LocalStorageUtil.setItem(REMEMBER_ME_KEY, rememberMe);
      }
      this.cookie.delete('remember_me', null, this.domainUtils.getPortalDomain());
    }
  }
}

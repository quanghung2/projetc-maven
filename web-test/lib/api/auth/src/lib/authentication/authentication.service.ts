import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AddEmailRequest,
  AuthInfo,
  CreateNewPasswordRequest,
  LoginSession,
  LoginSessionResponse,
  MyInfo,
  ResetPasswordRequest,
  VerifyEmail
} from './authentication.model';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  session: LoginSessionResponse;
  constructor(private http: HttpClient) {}

  addEmail(req: AddEmailRequest): Observable<void> {
    return this.http.post<void>('/auth/private/v1/email', req);
  }

  createEmailToken(req: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>('/auth/private/v1/password/reset/tokens', req);
  }

  verifyEmail(x: VerifyEmail): Observable<void> {
    let query = new HttpParams().set('token', x.token).set('email', x.email);
    if (x.domain) {
      query = query.set('domain', x.domain);
    }
    if (x.context) {
      query = query.set('context', x.context);
    }
    return this.http.get<void>(`auth/private/v1/email/verify`, { params: query });
  }

  verifyResetPassword(token: string, email: string): Observable<void> {
    const query = new HttpParams().set('email', email);
    return this.http.get<void>(`/auth/private/v1/password/reset/tokens/${token}`, { params: query });
  }

  createNewPassword(req: CreateNewPasswordRequest): Observable<void> {
    return this.http.post<void>('/auth/private/v1/password', req);
  }

  getLoginSession(isRecent?: boolean): Observable<LoginSessionResponse> {
    let params = new HttpParams().set('limit', String(10)).set('sort', 'lastLoginDateTime,desc');
    if (isRecent) {
      params = params.set('recent', String(true));
    }
    return this.http.get<LoginSessionResponse>('/auth/private/v1/audit', { params: params }).pipe(
      map((response: LoginSessionResponse) => {
        response.items = response.items.map((temp: LoginSession) => {
          return new LoginSession(temp);
        });
        this.session = response;
        return response;
      })
    );
  }

  resendEmailToken(resendEmailTokenRequest: VerifyEmail): Observable<void> {
    return this.http.post<void>('/auth/private/v1/token', resendEmailTokenRequest);
  }

  deleteEmail(x: VerifyEmail): Observable<void> {
    const query = new HttpParams().set('email', x.email).set('domain', x.domain);
    return this.http.delete<void>('/auth/private/v1/email', { params: query });
  }

  deleteEmailToken(x: VerifyEmail): Observable<void> {
    const query = new HttpParams().set('token', x.token).set('email', x.email).set('domain', x.domain);
    return this.http.delete<void>('/auth/private/v1/token', { params: query });
  }

  getMyInfo(): Observable<MyInfo | null> {
    return this.http
      .get<MyInfo | void>(`/auth/private/v1/ext/myinfosg`)
      .pipe(map(res => (res != null ? new MyInfo(<MyInfo>res) : null)));
  }

  createRedirectLink(originUrl: string, type: any): Observable<string> {
    return this.http
      .post<string>(`/auth/private/v1/ext/myinfosg/oauth2/url`, { originUrl: originUrl, type: type })
      .pipe(map((res: any) => res.url || null));
  }

  checkAuth(ssoToken: string, orgUuid: string, appId: string): Observable<AuthInfo> {
    const body = {
      ssoToken: ssoToken,
      orgUuid: orgUuid,
      appId: appId
    };
    return this.http.post<AuthInfo>(`/auth/private/v1/sso/auth`, body).pipe(map(res => new AuthInfo(res)));
  }
}

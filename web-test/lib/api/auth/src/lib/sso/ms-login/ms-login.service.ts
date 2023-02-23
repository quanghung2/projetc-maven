import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateRedirectLinkReq, VerifyStatusReq } from './ms-login.model';
import { LoginResponse } from '../../authentication/authentication.model';

@Injectable({
  providedIn: 'root'
})
export class MsLoginService {
  constructor(private http: HttpClient) {}

  createRedirectLink(req: CreateRedirectLinkReq): Observable<string> {
    return this.http.post<string>(`/auth/private/v1/login/sso/ms/url`, req).pipe(map((res: any) => res.url || null));
  }

  verifyStatus(req: VerifyStatusReq): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`/auth/private/v1/login/sso/ms`, req);
  }
}

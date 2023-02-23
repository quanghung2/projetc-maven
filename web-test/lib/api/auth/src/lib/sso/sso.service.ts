import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {AppInfo, GetJwtReq, GetJwtResp, VerifyJWtResp} from './sso.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SsoService {
  constructor(private http: HttpClient) {}

  getJWT(req: GetJwtReq): Observable<GetJwtResp> {
    return this.http.post<GetJwtResp>(`auth/private/v2/sso/tokens`, req);
  }

  verifyJWT(token: string, appId: string): Observable<VerifyJWtResp> {
    const params = new HttpParams().set('token', token).set('appId', appId);
    return this.http.get<VerifyJWtResp>(`auth/private/v2/sso/tokens`, { params: params });
  }

  getAppByAppId(appId: string): Observable<AppInfo> {
    return this.http.get<AppInfo>(`apps/private/v2/application/${appId}`);
  }
}

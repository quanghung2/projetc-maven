import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MsLoginRedirectService {
  constructor(private http: HttpClient) {}

  getOriginalUrl(state: string): Observable<OrginalDataResp> {
    return this.http.get<OrginalDataResp>(`/auth/private/v1/login/sso/ms/states/${state}`);
  }
}

export interface OrginalDataResp {
  srcUrl: string;
  deviceType: 'web' | 'mobile' | 'desktop';
}

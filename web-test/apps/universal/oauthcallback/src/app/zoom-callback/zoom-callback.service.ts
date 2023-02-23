import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZoomRedirectService {
  constructor(private http: HttpClient) {}

  fetchOriginalDomain(code: string, state: string): Observable<OriginalDomainResponse> {
    return this.http.post<OriginalDomainResponse>(`auth/private/v1/ext/zoom/oauth2/verify`, {
      code: code,
      state: state
    });
  }
}

export interface OriginalDomainResponse {
  orgUuid: string;
  originUrl: string;
}

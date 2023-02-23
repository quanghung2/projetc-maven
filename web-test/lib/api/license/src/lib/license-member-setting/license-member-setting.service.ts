import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LicenseMemberSettingService {
  constructor(private http: HttpClient) {}

  getLicensesByIdentityUuid(uuid: string): Observable<string[]> {
    const params = new HttpParams().set('identityUuid', uuid);
    return this.http.get<string[]>(`/license/private/v1/features`, { params: params });
  }
}

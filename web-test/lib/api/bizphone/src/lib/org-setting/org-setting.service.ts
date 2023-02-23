import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrgSetting } from './org-setting.model';

@Injectable({
  providedIn: 'root'
})
export class OrgSettingService {
  constructor(private http: HttpClient) {}

  fetch(): Observable<OrgSetting> {
    return this.http.get<OrgSetting>(`extension/private/org-setting`);
  }

  update(orgSetting: OrgSetting): Observable<OrgSetting> {
    return this.http.put<OrgSetting>(`extension/private/org-setting/${orgSetting.id}`, orgSetting);
  }
}

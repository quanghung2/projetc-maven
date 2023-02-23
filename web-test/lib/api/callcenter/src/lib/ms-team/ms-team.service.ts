import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TeamExtension, TeamExtensionReq, TeamInfo } from './ms-team.model';

@Injectable({ providedIn: 'root' })
export class MsTeamCallCenterService {
  constructor(private http: HttpClient) {}

  getTeam(): Observable<TeamInfo> {
    return this.http.get<TeamInfo>('/callcenter/private/v1/msTeam').pipe(
      map(res => {
        res.dnsTxtRecordKey = res.dnsTxtRecordKey || `${res.teamId}.${res.anyNodeDomain}`;
        return res;
      })
    );
  }

  createTeam(anyNodeDomain: string): Observable<TeamInfo> {
    return this.http
      .post<TeamInfo>('/callcenter/private/v1/msTeam', {
        anyNodeDomain: anyNodeDomain
      })
      .pipe(
        map(res => {
          res.dnsTxtRecordKey = res.dnsTxtRecordKey || `${res.teamId}.${res.anyNodeDomain}`;
          return res;
        })
      );
  }

  getExtensions(): Observable<TeamExtension[]> {
    return this.http
      .get<TeamExtension[]>('/callcenter/private/v1/msTeam/extensions')
      .pipe(map(extensions => extensions.map(ext => new TeamExtension(ext))));
  }

  updateExtension(body: TeamExtensionReq): Observable<TeamExtension> {
    return this.http.post<TeamExtension>('/callcenter/private/v1/msTeam/extensions', body).pipe(
      catchError(err => {
        if (err.code === 'callcenter.extensionNotFound') {
          return throwError({ message: `Extension ${body.extKey} not found` });
        } else {
          return throwError({
            message: `This extension / ddi number cannot be linked. Please contact your administrator`
          });
        }
      })
    );
  }

  checkDeviceExistence(extKeys: string[]) {
    let params = new HttpParams();
    params = params.set('extKeys', extKeys.toString()).set('deviceType', 'MSTEAM');
    return this.http.get('/callcenter/private/v3/extensions/checkDeviceExistence', { params: params });
  }

  updateTXTRecordOnRoute53(dnsTxtRecordValue: string): Observable<TeamInfo> {
    return this.http.put<TeamInfo>('/callcenter/private/v1/msTeam', {
      dnsTxtRecordValue: `"${dnsTxtRecordValue}"`
    });
  }

  generatePowerShell() {
    return this.http.post<any>('/callcenter/private/v1/msTeam/powershellTemplate', {}, <any>{
      responseType: 'text'
    });
  }
}

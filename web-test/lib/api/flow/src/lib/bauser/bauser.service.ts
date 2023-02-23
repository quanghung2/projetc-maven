import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TriggerDef } from '../trigger-def/trigger-def.model';
import { BaUser, SaveBaUserReq } from './bauser.model';

@Injectable({
  providedIn: 'root'
})
export class BaUserService {
  constructor(private http: HttpClient) {}

  getList(): Observable<BaUser[]> {
    return this.http.get<BaUser[]>(`flow/private/bauser/v2/configurations`);
  }

  getTriggerDefs(releaseGroupId: string, excludeUsingDefs: boolean): Observable<TriggerDef[]> {
    const params = new HttpParams()
      .set('releaseGroupId', releaseGroupId)
      .set('excludeUsingDefs', String(excludeUsingDefs));

    return this.http.get<TriggerDef[]>(`flow/private/bauser/v2/triggerDefs`, { params });
  }

  getBaUser(releaseGroupId: string, originalTriggerDefUuid: string, additionalKey: string): Observable<BaUser> {
    let params = new HttpParams()
      .set('releaseGroupId', releaseGroupId)
      .set('originalTriggerDefUuid', originalTriggerDefUuid);

    if (additionalKey) {
      params = params.set('additionalKey', additionalKey);
    }

    return this.http.get<BaUser[]>(`flow/private/bauser/v2/configurations`, { params }).pipe(
      map(baUsers => {
        if (baUsers.length > 0) {
          return baUsers[0];
        }
        return null;
      })
    );
  }

  saveBaUser(req: SaveBaUserReq): Observable<BaUser> {
    return this.http.post<BaUser>(`flow/private/bauser/v2/configurations`, req);
  }

  deactivateBaUser(originalTriggerDefUuid: string, req: SaveBaUserReq): Observable<void> {
    return this.http.post<void>(`flow/private/bauser/v2/configurations/${originalTriggerDefUuid}/deactivate`, req);
  }
}

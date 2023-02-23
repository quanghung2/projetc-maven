import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { map, tap } from 'rxjs/operators';
import { Application, FetchPortalAppResp } from './app.model';
import { PortalAppStore } from './portal-app.store';

@Injectable({
  providedIn: 'root'
})
export class PortalAppService {
  constructor(private http: HttpClient, private store: PortalAppStore) {}

  fetchAll(orgUuid?: string) {
    let headers = new HttpHeaders();
    if (!!orgUuid) {
      headers = headers.set(X_B3_HEADER.orgUuid, orgUuid);
    }
    return this.http
      .get<FetchPortalAppResp>(`apps/private/v1/application/getListAppOnPortal`, { headers: headers })
      .pipe(
        map(resp => {
          resp.list = resp.list.map(app => new Application(app));
          return resp;
        }),
        tap(resp => this.store.set(resp.list))
      );
  }
}

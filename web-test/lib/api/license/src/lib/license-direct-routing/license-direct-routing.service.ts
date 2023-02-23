import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TeamInfo } from '@b3networks/api/callcenter';
import { Page, Pageable } from '@b3networks/api/common';
import { X_PAGINATION } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DirectRoutingExtension,
  DirectRoutingOrg,
  DirectRoutingReq,
  ProvisionToAnyNodeReq
} from './license-direct-routing.model';

@Injectable({
  providedIn: 'root'
})
export class LicenseDirectRoutingService {
  constructor(private http: HttpClient) {}

  provisionToAnyNode(devices: ProvisionToAnyNodeReq[]) {
    let body = { devices: devices };
    return this.http.post(`license/private/v2/licenses/directRouting/exts/provisionToAnyNode`, body);
  }

  getDirectRoutingOrg() {
    return this.http.get<DirectRoutingOrg>(`license/private/v2/licenses/directRouting/org/fetch`);
  }

  getExtMapping() {
    return this.http.get<DirectRoutingOrg[]>(`license/private/v2/licenses/directRouting/exts`);
  }

  createDirectRouting(directRouting: DirectRoutingReq) {
    return this.http.post<TeamInfo>(`license/private/v2/licenses/directRouting/org/enable`, directRouting);
  }

  updateDirectRouting(directRouting: DirectRoutingReq) {
    return this.http.put<TeamInfo>(`license/private/v2/licenses/directRouting/org/update`, directRouting);
  }

  getDirectRoutings(pageable?: Pageable): Observable<Page<DirectRoutingExtension>> {
    let params = new HttpParams();
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('perpage', String(pageable.perPage));
    }
    return this.http
      .get<DirectRoutingExtension[]>(`license/private/v2/licenses/directRouting/extensions/query`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<DirectRoutingExtension>();
          page.content = resp.body;
          page.totalCount = +resp.headers.get(X_PAGINATION.totalCount);
          return page;
        })
      );
  }
}

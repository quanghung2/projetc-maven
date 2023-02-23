import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { tap } from 'rxjs/operators';
import { OrgLink } from './org-link.model';
import { OrgLinkStore } from './org-link.store';

export interface CreateGroupBody {
  organizationUuid: string;
  organizationGroupUuid?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrgLinkService {
  constructor(private http: HttpClient, private store: OrgLinkStore) {}

  getGroups(userUuid: string) {
    const headers = new HttpHeaders().set(X_B3_HEADER.userUuid, userUuid);

    return this.http
      .get<OrgLink[]>(`auth/private/v1/organizations/groups`, { headers })
      .pipe(
        tap(orgLink => {
          this.store.set(orgLink);
        })
      );
  }

  createGroup(userUuid: string, body: CreateGroupBody) {
    const headers = new HttpHeaders().set(X_B3_HEADER.userUuid, userUuid);

    return this.http
      .post<OrgLink>(`auth/private/v1/organizations/groups`, body, { headers })
      .pipe(
        tap(res => {
          this.store.upsert(res.uuid, res);
        })
      );
  }

  acceptGroup(userUuid: string, groupUuid: string) {
    const headers = new HttpHeaders().set(X_B3_HEADER.userUuid, userUuid);

    return this.http.put<any>(`auth/private/v1/organizations/groups/${groupUuid}/accept`, {}, { headers });
  }

  denyGroup(userUuid: string, groupUuid: string) {
    const headers = new HttpHeaders().set(X_B3_HEADER.userUuid, userUuid);

    return this.http.put<any>(`auth/private/v1/organizations/groups/${groupUuid}/reject`, {}, { headers });
  }
}

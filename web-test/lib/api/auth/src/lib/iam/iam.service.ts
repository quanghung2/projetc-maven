import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { GetIAMMemberReqParam, IAMMember, SortMemberDirection } from '../member/member';
import { PolicyDocument } from '../organization-policy/policty-document.model';
import { IAMGrantedPermission, IAMGroup, IAMPermission, UpdateIAMGroupMemberReq } from './iam.model';
import { IamStore } from './iam.store';

@Injectable({
  providedIn: 'root'
})
export class IamService {
  constructor(private http: HttpClient, private store: IamStore) {}

  fetchAllPermissions(): Observable<IAMPermission[]> {
    return this.http.get<IAMPermission[]>(`auth/private/v1/iam/all`).pipe(
      map(list => list.map(permission => new IAMPermission(permission))),
      tap(permissions => this.store.update({ allPermissions: permissions }))
    );
  }

  fetchGroups() {
    return this.http.get<IAMGroup[]>(`auth/private/v1/iam/group/all`).pipe(
      catchError(_ => of(<IAMGroup[]>[])),
      map(x => x || []),
      tap(groups => this.store.update({ groups: groups }))
    );
  }

  getIAMGroupMember(orgUuid: string, identityUuid: string) {
    return this.http
      .get<IAMGroup[]>(`auth/private/v1/organizations/${orgUuid}/iam/members/${identityUuid}/groups`)
      .pipe(
        catchError(_ => of(<IAMGroup[]>[])),
        map(x => x || [])
      );
  }

  updateIAMGroupMember(orgUuid: string, identityUuid: string, req: UpdateIAMGroupMemberReq) {
    return this.http.put<any>(`auth/private/v1/organizations/${orgUuid}/iam/members/${identityUuid}/groups`, req);
  }

  appendIAMMember(orgUuid: string, identityUuid: string, req: Partial<IAMGrantedPermission>) {
    return this.http.put(`auth/private/v1/organizations/${orgUuid}/iam/members/${identityUuid}/append`, req);
  }

  removeIAMMember(orgUuid: string, identityUuid: string, req: Partial<IAMGrantedPermission>) {
    return this.http.put(`auth/private/v1/organizations/${orgUuid}/iam/members/${identityUuid}/remove`, req);
  }

  getMembersByGroupUuid(
    groupUuid: string,
    req: GetIAMMemberReqParam,
    pageable?: Pageable
  ): Observable<Page<IAMMember>> {
    this.store.setLoading(true);
    let params = new HttpParams().set('sort', req.sort || SortMemberDirection.ASC);
    if (req.keyword) {
      params = params.set('keyword', req.keyword);
    }
    if (pageable) {
      params = params.set('page', pageable?.page).set('size', pageable?.perPage);
    }
    return this.http
      .get<IAMMember[]>(`auth/private/v1/iam/group/${groupUuid}/members`, { params: params, observe: 'response' })
      .pipe(
        map(resp => {
          const content = resp.body.map(m => {
            const user = { ...m, iamPolicy: m.iamPolicy || {} } as IAMMember;
            user.iamPolicy.policies = user.iamPolicy?.policies?.map(u => new IAMGrantedPermission(u));
            return new IAMMember(user);
          });
          const totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return {
            content: content,
            totalCount: totalCount
          } as Page<IAMMember>;
        }),
        finalize(() => this.store.setLoading(false))
      );
  }

  getMappedActionsByGroupUuid(groupUuid: string): Observable<IAMGrantedPermission[]> {
    return this.http.get<IAMGrantedPermission[]>(`auth/private/v1/iam/group/${groupUuid}/actions`).pipe(
      map(list => list.map(p => new IAMGrantedPermission(p))),
      tap(actions => {
        this.store.update({ actions: actions });
      })
    );
  }

  getMemberWithIAM(orgUuid: string, memberUuid: string, groupID?: string): Observable<IAMMember> {
    let params = new HttpParams().set('withIam', true);
    if (groupID) {
      params = params.set('filteredByIamGroup', groupID);
    }
    return this.http
      .get<IAMMember>(`auth/private/v1/organizations/${orgUuid}/members/${memberUuid}`, { params: params })
      .pipe(
        map(m => {
          return new IAMMember({ ...m, iamPolicy: new PolicyDocument(m.iamPolicy) });
        }),
        tap(member => {
          this.store.update({ member: member });
        })
      );
  }
}

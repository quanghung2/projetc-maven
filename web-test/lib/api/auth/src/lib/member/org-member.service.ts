import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_PAGINATION } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { IAMGrantedPermission } from '../iam/iam.model';
import { Identity, MemberRole } from '../identity/identity';
import { PolicyDocument } from '../organization-policy/policty-document.model';
import {
  AddMemberRequest,
  CreateCredentialRequest,
  ExportMember,
  GetMembersReq,
  ImportMemberRequest,
  ImportMemberResp,
  Member,
  MemberPin,
  MemberStatus,
  MemberUpdateRequest,
  PendingMember,
  ResendActivationEmailReq,
  SearchMemberIncludeTeam,
  TriggerExportMember
} from './member';
import { OrgMemberQuery } from './org-member.query';
import { OrgMemberStore } from './org-member.store';

@Injectable({
  providedIn: 'root'
})
export class OrgMemberService {
  constructor(private http: HttpClient, private orgMemberStore: OrgMemberStore, private query: OrgMemberQuery) {}

  getDirectoryMembers(req: GetMembersReq, pageable?: Pageable, storable: boolean = true): Observable<Page<Member>> {
    this.orgMemberStore.setLoading(true);
    const requestParams = [
      req.sort,
      req.keyword,
      req.filterExtension,
      MemberStatus.active,
      `${MemberStatus.active},${MemberStatus.pending}`,
      req.roles,
      req.team
    ].filter(Boolean);
    let params = new HttpParams();
    Object.keys(req)
      .filter(key => req[key] != null)
      .forEach(key => {
        if (key === 'roles') {
          params = req[key].length ? params.set('role', req[key].join(',')) : params;
        } else {
          params = requestParams.includes(req[key]) ? params.set(key, req[key]) : params;
        }
      });

    if (pageable) {
      params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    }

    if (req.teamUuid) {
      params = params.set('team', req.teamUuid);
    }

    return this.http.get<Member[]>(`directory/private/v1/members`, { params: params, observe: 'response' }).pipe(
      map(resp => {
        const page = new Page<Member>();
        page.content = resp.body.map(mem => new Member({ ...mem, uuid: mem.memberUuid, displayName: mem.name }));
        page.totalCount = +resp.headers.get(X_PAGINATION.totalCount);
        return page;
      }),
      tap(page => {
        if (!storable) {
          return;
        }

        this.orgMemberStore.set(page.content);
        this.orgMemberStore.setLoading(false);
      })
    );
  }

  getMembers(req: GetMembersReq, pageable?: Pageable, addon?: { ignoreStore: boolean }): Observable<Page<Member>> {
    this.orgMemberStore.setLoading(true);
    let params = new HttpParams();
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    }

    if (req.sort) {
      params = params.set('sort', req.sort);
    }

    return this.http
      .post<Member[]>(`auth/private/v2/organizations/${req.orgUuid}/members`, req, {
        params: params,
        observe: 'response' // to display the full response & as 'body' for type cast
      })
      .pipe(
        map(resp => {
          const page = new Page<Member>();
          page.content = resp.body.map(mem => new Member(mem));
          page.totalCount = +resp.headers.get(X_PAGINATION.totalCount);
          return page;
        }),
        tap(page => {
          if (!addon?.ignoreStore) {
            this.orgMemberStore.set(page.content);
          }

          this.orgMemberStore.setLoading(false);
        })
      );
  }

  searchMembers(orgUuid: string, req: SearchMemberIncludeTeam, pageable?: Pageable) {
    let params = new HttpParams();
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    }

    // params (optional): page=0&size=100
    return this.http
      .post<{ identityUuid: string; name: string; photo: string }[]>(
        `auth/private/v2/organizations/${orgUuid}/members`,
        req,
        { params }
      )
      .pipe(catchError(err => of([])));
  }

  getMembersNoStore(req: GetMembersReq): Observable<Page<Member>> {
    this.orgMemberStore.setLoading(true);

    return this.http
      .post<Member[]>(`auth/private/v2/organizations/${req.orgUuid}/members`, req, {
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<Member>();
          page.content = resp.body.map(mem => new Member(mem));
          page.totalCount = +resp.headers.get(X_PAGINATION.totalCount);
          return page;
        }),
        tap(_ => {
          this.orgMemberStore.setLoading(false);
        })
      );
  }

  getMember(orgUuid: string, memeberUuid: string, getFromStore: boolean = true): Observable<Member> {
    const req = this.http.get<Member>(`auth/private/v1/organizations/${orgUuid}/members/${memeberUuid}`).pipe(
      map(mem => new Member(mem)),
      tap(member => this.orgMemberStore.add(member))
    );

    if (getFromStore) {
      return this.query.getEntity(memeberUuid) != null ? EMPTY : req;
    } else {
      return req;
    }
  }

  addMember(orgUuid: string, member: AddMemberRequest): Observable<void> {
    return this.http.post<void>(`auth/private/v1/organizations/${orgUuid}/members`, member);
  }

  deleteMember(orgUuid: string, memberUuid: string): Observable<void> {
    return this.http.delete<void>(`auth/private/v1/organizations/${orgUuid}/members/${memberUuid}`);
  }

  triggerExportMember(isExportDirectoryMember?: boolean, teamUuid?: string): Observable<TriggerExportMember> {
    const url = isExportDirectoryMember
      ? `/directory/private/v2/members/export`
      : `/auth/private/v1/organizations/members/export`;
    return this.http
      .post<TriggerExportMember>(url, { team: teamUuid })
      .pipe(map(resp => new TriggerExportMember(resp)));
  }

  getExportMember(jobId: string, isExportDirectoryMember?: boolean): Observable<ExportMember> {
    const url = isExportDirectoryMember
      ? `/directory/private/v2/members/export/${jobId}`
      : `/auth/private/v1/organizations/members/export/${jobId}`;
    return this.http.get<ExportMember>(url).pipe(map(resp => new ExportMember(resp)));
  }

  exportPendingMember(): Observable<TriggerExportMember> {
    return this.http.post<TriggerExportMember>(`/auth/private/v1/organizations/members/pending/export`, {});
  }

  getExportUrlForPendingMember(jobId: string): Observable<ExportMember> {
    return this.http.get<ExportMember>(`/auth/private/v1/organizations/members/pending/export/${jobId}`);
  }

  importMember(orgUuid: string, req: ImportMemberRequest): Observable<ImportMemberResp> {
    return this.http
      .post<ImportMemberResp>(`/auth/private/v1/organizations/${orgUuid}/members/bulk`, req, {
        withCredentials: true
      })
      .pipe(map(resp => new ImportMemberResp(resp)));
  }

  importMemberIncludeEmail(req: ImportMemberRequest): Observable<ImportMemberResp> {
    return this.http
      .post<ImportMemberResp>(`/auth/private/v1/organizations/members/imports`, req, {
        withCredentials: true
      })
      .pipe(map(resp => new ImportMemberResp(resp)));
  }

  importMemberIncludeUsername(orgUuid: string, req: ImportMemberRequest): Observable<ImportMemberResp> {
    return this.http
      .post<ImportMemberResp>(`/auth/private/v2/organizations/${orgUuid}/members/bulk`, req, {
        withCredentials: true
      })
      .pipe(map(resp => new ImportMemberResp(resp)));
  }

  resendActivationEmails(req: ResendActivationEmailReq): Observable<void> {
    return this.http.put<void>(`/auth/private/v1/organizations/members/imports/activations`, req);
  }

  deletePendingMembers(id: number): Observable<void> {
    return this.http.delete<void>(`/auth/private/v1/organizations/members/imports/activations/${id}`);
  }

  getPendingMembers(req: GetMembersReq): Observable<PendingMember[]> {
    const params = new HttpParams().set('activated', 'false').set('keyword', req.keyword || '');

    return this.http
      .get<PendingMember[]>(`/auth/private/v1/organizations/members/imports/activations`, { params: params })
      .pipe(
        map(list =>
          list.map(m => {
            return new PendingMember({ ...m, member: new Identity(m.member) });
          })
        ),
        tap(members => {
          switch (req.sort) {
            case 'identity.displayName':
              members = members.sort((a, b) => a?.member.displayName?.localeCompare(b?.member.displayName));
              break;
            case 'email':
              members = members.sort((a, b) => a?.email?.localeCompare(b?.email));
              break;
          }
          if (members.length > 0) {
            this.orgMemberStore.update({ hasPendingMember: true });
          }
        })
      );
  }

  fetchMemberPins(orgUuid: string, memberUuid: string): Observable<MemberPin[]> {
    return this.http.get<MemberPin[]>(`auth/private/v1/organizations/${orgUuid}/members/${memberUuid}/pins`);
  }

  createMemberPin(orgUuid: string, memberUuid: string) {
    return this.http.put(`auth/private/v1/organizations/${orgUuid}/members/${memberUuid}/pins`, {});
  }

  updateMember(orgUuid: string, memberUuid: string, req: MemberUpdateRequest): Observable<void> {
    return this.http.put<void>(`auth/private/v1/organizations/${orgUuid}/members/${memberUuid}`, req);
  }

  updateVIPMemberForLicenseOrg(memberUuid: string, req: MemberUpdateRequest): Observable<void> {
    return this.http.put<void>(`directory/private/v1/members/${memberUuid}`, req);
  }

  getRoleList(orgUuid: string): Observable<MemberRole[]> {
    return this.http.get<MemberRole[]>(`/auth/private/v1/organizations/${orgUuid}/roles`);
  }

  createCredential(orgUUid: string, memberUuid: string, createCredentialRequest: CreateCredentialRequest) {
    return this.http.post(
      `/auth/private/v1/organizations/${orgUUid}/members/${memberUuid}/credentials`,
      createCredentialRequest
    );
  }

  getPolicyDocument(orgUuid: string, memberUuid: string): Observable<PolicyDocument> {
    return this.http.get<PolicyDocument>(`auth/private/v2/organizations/${orgUuid}/iam/members/${memberUuid}`).pipe(
      map(policy => new PolicyDocument(policy)),
      map(policy => {
        const policyResources = policy.policies.reduce((prev, curr) => {
          const key = `${curr.service}_${curr.action}`;
          prev[key] = prev[key] || curr;

          prev[key].resources = [...new Set([...prev[key].resources, ...curr.resources])];

          if (prev[key].resources.includes('*')) {
            prev[key].resources = ['*'];
          }
          return prev;
        }, {});

        policy.policies = Object.values(policyResources);
        return policy;
      }),
      tap(policy => this.orgMemberStore.update(memberUuid, { policyDocument: policy }))
    );
  }

  updatePolicyDocument(orgUuid: string, memberUuid: string, req: PolicyDocument): Observable<PolicyDocument> {
    return this.http
      .put<PolicyDocument>(`/auth/private/v1/organizations/${orgUuid}/iam/members/${memberUuid}`, req)
      .pipe(
        map(resp => new PolicyDocument(resp)),
        tap(resp => this.orgMemberStore.update(memberUuid, { policyDocument: resp }))
      );
  }

  activeMember(member: Member) {
    this.orgMemberStore.setActive(member.uuid);
  }

  removeActive(id: ID) {
    if (id) {
      this.orgMemberStore.removeActive(id);
    }
  }

  transferOwner(orgUuid: string, newOwnerUuid: string): Observable<void> {
    const body = {
      newOwnerUuid: newOwnerUuid
    };
    return this.http.put<void>(`/auth/private/v1/organizations/${orgUuid}/owners`, body);
  }

  appendViewOrganization(orgUuid: string, memberUuid: string, req: IAMGrantedPermission): Observable<PolicyDocument> {
    return this.http
      .put<PolicyDocument>(`auth/private/v1/organizations/${orgUuid}/iam/members/${memberUuid}/append`, req)
      .pipe(
        map(resp => new PolicyDocument(resp)),
        tap(resp => this.orgMemberStore.update(memberUuid, { policyDocument: resp }))
      );
  }
  removeViewOrganization(orgUuid: string, memberUuid: string, req: IAMGrantedPermission): Observable<PolicyDocument> {
    return this.http
      .put<PolicyDocument>(`auth/private/v1/organizations/${orgUuid}/iam/members/${memberUuid}/remove`, req)
      .pipe(
        map(resp => new PolicyDocument(resp)),
        tap(resp => this.orgMemberStore.update(memberUuid, { policyDocument: resp }))
      );
  }
}

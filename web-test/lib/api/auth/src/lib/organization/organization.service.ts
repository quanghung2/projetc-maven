import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { DEFAULT_ORG_ICON, DEFAULT_ORG_LOGO } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  BillingInfo,
  ChangeCompanyRequest,
  CheckOrganizationResponse,
  FindOrganizationReq,
  Organization,
  PinPolicy,
  QueryOrgReq,
  SetDemoReq,
  UpdateCompanyRequest
} from './organization';
import { OrganizationQuery } from './organization.query';
import { OrganizationStore } from './organization.store';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  constructor(
    private http: HttpClient,
    private organizationStore: OrganizationStore,
    private query: OrganizationQuery
  ) {}

  findOrganizations(
    req?: FindOrganizationReq,
    pageable: Pageable = { page: 0, perPage: 100 }
  ): Observable<Organization[]> {
    let params = new HttpParams();
    if (req) {
      Object.keys(req)
        .filter(key => req[key] != null)
        .forEach(p => {
          params = params.set(p, req[p]);
        });
    }
    params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));

    return this.http
      .get<Organization[]>(`/auth/private/v1/organizations`, {
        params: params
      })
      .pipe(map(list => list.map(org => new Organization(org))));
  }

  getOrganizationByUuid(
    orgUuid: string,
    skipStatusCheck: boolean = false,
    includeMsTeamsTenantId: boolean = false
  ): Observable<Organization> {
    return this.http
      .get<Organization>(`/auth/private/v1/organizations/${orgUuid}`, {
        params: { skipStatusCheck: String(skipStatusCheck), includeMsTeamsTenantId: String(includeMsTeamsTenantId) }
      })
      .pipe(
        map(org => {
          const i = new Organization(org);
          if (!i.logoUrl) i.logoUrl = DEFAULT_ORG_LOGO;
          return i;
        }),
        tap(org => this.organizationStore.upsert(orgUuid, org))
      );
  }

  queryOrgs(req: QueryOrgReq, pageble: Pageable) {
    let params = new HttpParams();
    if (pageble) {
      params = params.set('page', String(pageble.page)).set('size', String(pageble.perPage));
    }
    return this.http.post<Organization[]>(`auth/private/v2/organizations/query`, req, { params: params }).pipe(
      map(list => list.map(o => new Organization(o))),
      tap(orgs => this.organizationStore.upsertMany(orgs, { baseClass: Organization }))
    );
  }

  queryOrgsByUuid(orgUuids: string[]) {
    return this.http
      .post<Organization[]>(`/auth/private/v2/organizations/query`, {
        uuids: orgUuids
      })
      .pipe(
        map(list => list.map(o => new Organization(o))),
        tap(orgs => this.organizationStore.upsertMany(orgs, { baseClass: Organization }))
      );
  }

  changeCompanyName(req: ChangeCompanyRequest): Observable<void> {
    return this.http.post<void>(`/auth/private/v1/forms/organizations/${req.orgUuid}`, req);
  }

  updateCompanyInfo(updateCompanyRequest: UpdateCompanyRequest): Observable<Organization> {
    return this.http
      .put<Organization>(`/auth/private/v1/organizations/${updateCompanyRequest.orgUuid}`, updateCompanyRequest)
      .pipe(
        map(org => {
          const i = new Organization(org);
          if (!i.logoUrl) i.logoUrl = DEFAULT_ORG_ICON;
          return i;
        }),

        tap(org => {
          this.organizationStore.upsert(org.uuid, org, { baseClass: Organization });
        })
      );
  }

  updateBillingInfo(newBillingInfo: BillingInfo) {
    this.organizationStore.update({ billingInfo: newBillingInfo });
  }

  getPinPolicy(): Observable<PinPolicy> {
    return this.http.get<PinPolicy>(`/auth/private/v1/organizations/pin/policies`).pipe(map(res => new PinPolicy(res)));
  }

  updatePinPolicy(req: PinPolicy): Observable<void> {
    return this.http.put<void>(`/auth/private/v1/organizations/pin/policies`, req);
  }

  deleteAdminForTeam(orgUuid: string, teamUuid: string, adminUuid: string) {
    return this.http.delete<void>(`/auth/private/v1/organizations/${orgUuid}/teams/${teamUuid}/admins/${adminUuid}`);
  }

  setDemoTag(orgUuid: string, req: SetDemoReq) {
    return this.http.put<void>(`/auth/private/v1/organizations/${orgUuid}/internal`, req);
  }

  checkMsTeamsTenantId(orgUuid: string) {
    let params = new HttpParams();
    params = params.set('includeMsTeamsTenantId', String('true'));
    return this.http.get<Organization>(`/auth/private/v1/organizations/${orgUuid}`, {
      params: params
    });
  }

  checkOrgUuid(orgUuid: string) {
    return this.http.get<CheckOrganizationResponse>(`/auth/private/v2/organizations/${orgUuid}/check`);
  }
}

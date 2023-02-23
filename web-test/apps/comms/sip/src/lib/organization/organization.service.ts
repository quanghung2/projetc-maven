import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateCompanyFormRequest,
  CreateCompanyRequestV2,
  CreateCompanyV2Response,
  Organization
} from './organization';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  constructor(private http: HttpClient) {}

  findOrganizations(page: number = 0, perPage: number = 100): Observable<Organization[]> {
    return this.http
      .get<Organization[]>(`/auth/private/v1/organizations?page=${page}&size=${perPage}`)
      .pipe(map(list => list.map(org => new Organization(org))));
  }

  getOrganizationByUuid(orgUuid: string, skipStatusCheck: boolean = false): Observable<Organization> {
    return this.http
      .get<Organization>(`/auth/private/v1/organizations/${orgUuid}`, {
        params: { skipStatusCheck: String(skipStatusCheck) }
      })
      .pipe(map(org => new Organization(org)));
  }

  getOrganizationByShortName(shortName: string): Observable<Organization> {
    return this.http
      .get<Organization>(`/auth/private/v1/organizations/s/${shortName}`)
      .pipe(map(org => new Organization(org)));
  }

  createCompanyV2(createCompanyRequest: CreateCompanyRequestV2): Observable<CreateCompanyV2Response> {
    return this.http.post<CreateCompanyV2Response>('/auth/private/v1/organizations', createCompanyRequest);
  }

  createCompanyForm(req: CreateCompanyFormRequest) {
    return this.http.post(`/auth/private/v1/organizations`, req);
  }
}

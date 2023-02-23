import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AsyncSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrivateHttpService } from '../private-http.service';
import { GetMemberResponse, Organization } from './../../models/organization.model';

declare const X: any;

@Injectable({ providedIn: 'root' })
export class AuthOrganizationService extends PrivateHttpService {
  private getMemberSubject: AsyncSubject<GetMemberResponse>;

  constructor(private httpClient: HttpClient) {
    super();
  }

  getMember(memberUuid: string) {
    if (!this.getMemberSubject) {
      this.getMemberSubject = new AsyncSubject();
      this.httpClient
        .get<Object>(this.constructFinalEndpoint(`/auth/private/v1/organizations/${X.orgUuid}/members/${memberUuid}`))
        .subscribe(
          res => {
            this.getMemberSubject.next(new GetMemberResponse(res));
            this.getMemberSubject.complete();
          },
          err => {
            this.getMemberSubject.error(err);
          }
        );
    }

    return this.getMemberSubject;

    // const orgUuid = this.routeService.getOrgUuid();
    // return this.httpClient.get<Object>(this.constructFinalEndpoint(`/auth/private/v1/organizations/${orgUuid}/members/${memberUuid}`))
    //   .pipe(map(res => new GetMemberResponse(res)));
  }

  getOrganization(orgUuid: string): Observable<Organization> {
    return this.httpClient
      .get(this.constructFinalEndpoint(`/auth/private/v1/organizations/${orgUuid}`))
      .pipe(map(res => new Organization(res)));
  }
}

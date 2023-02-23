import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { OrganizationPolicyStore } from './organization-policy.store';
import { PolicyDocument } from './policty-document.model';

@Injectable({ providedIn: 'root' })
export class OrganizationPolicyService {
  constructor(private store: OrganizationPolicyStore, private http: HttpClient) {}

  get(orgUuid: string) {
    if (this.store.getValue().ids.indexOf(orgUuid) === -1) {
      this.store.setLoading(true);
      return this.http.get<PolicyDocument>(`/auth/private/v1/iam/policies/self/organization`).pipe(
        map(org => new PolicyDocument(org).withOrgUuid(orgUuid)),
        map(org => {
          const policyResources = org.policies.reduce((prev, curr) => {
            const key = `${curr.service}_${curr.action}`;
            prev[key] = prev[key] || curr;

            prev[key].resources = [...new Set([...prev[key].resources, ...curr.resources])];

            if (prev[key].resources.includes('*')) {
              prev[key].resources = ['*'];
            }
            return prev;
          }, {});

          org.policies = Object.values(policyResources);
          return org;
        }),
        tap(org => {
          if (this.store.getValue().ids.length) {
            this.store.add(org);
          } else {
            this.store.set([org]);
          }
          this.store.update(state => {
            return { loadedOrgs: [...state.loadedOrgs, org.orgUuid], loading: false };
          });
        }),
        finalize(() => this.store.update({ loaded: true }))
      );
    } else {
      return EMPTY;
    }
  }
}

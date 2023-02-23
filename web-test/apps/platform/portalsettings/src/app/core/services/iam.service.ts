import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IAMAction } from '../models/iam-action.model';
import { PolicyDomain } from '../models/policy.model';
import { Resource } from '../models/resource.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IAMService {
  baseURL = '/auth/private/v1/iam/';
  constructor(private httpClient: HttpClient) {}

  getPolicyDomain(): Observable<PolicyDomain> {
    return this.httpClient.get<PolicyDomain>(this.baseURL + 'policies/self/domain').pipe(
      map(policyDomain => {
        if (!policyDomain) {
          return {
            policies: []
          };
        }

        return policyDomain;
      })
    );
  }

  getResources(): Observable<Resource[]> {
    return this.httpClient.get<Resource[]>(this.baseURL + 'services/ui/resources');
  }

  getActions(): Observable<IAMAction[]> {
    return this.httpClient.get<IAMAction[]>(this.baseURL + 'services/ui/actions');
  }

  updatePolicies(data: PolicyDomain): Observable<PolicyDomain> {
    return this.httpClient.put<PolicyDomain>(this.baseURL + 'policies/self/domain', data);
  }
}

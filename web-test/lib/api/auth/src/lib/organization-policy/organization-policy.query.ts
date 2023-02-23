import { Injectable } from '@angular/core';
import { arrayFind, QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAMGrantedPermission } from '../iam/iam.model';
import { OrganizationPolicyState, OrganizationPolicyStore } from './organization-policy.store';

@Injectable({ providedIn: 'root' })
export class OrganizationPolicyQuery extends QueryEntity<OrganizationPolicyState> {
  loadedOrg$ = this.select('loadedOrgs');
  loaded$ = this.select('loaded');

  constructor(protected override store: OrganizationPolicyStore) {
    super(store);
  }

  selectGrantedIAM(orgUuid: string, service: string, action: string) {
    return this.selectEntity(orgUuid, 'policies').pipe(
      arrayFind(policy => policy.isAllowedAction(service, action)),
      map(list =>
        list && list.length > 0
          ? list.length === 1
            ? list[0]
            : list.reduce((acc, it) => {
                acc.resources = [...acc.resources, ...it.resources];
                return acc;
              }, new IAMGrantedPermission({ service: service, action: action, resources: [] }))
          : null
      )
    );
  }

  selectHasGrantedResource(orgUuid: string, service: string, action: string, resource: string): Observable<boolean> {
    return this.selectEntity(orgUuid, 'policies').pipe(
      arrayFind(policy => policy.isAllowResource(service, action, resource)),
      map(list => (list && list.length > 0 ? true : false))
    );
  }

  getGrantedIAM(orgUuid: string, service: string, action: string) {
    const entity = this.getEntity(orgUuid);
    return entity && entity.policies ? entity.policies.find(p => p.isAllowedAction(service, action)) : null;
  }

  hasGrantedAction(orgUuid: string, service: string, action: string): boolean {
    const entity = this.getEntity(orgUuid);
    return entity && entity.policies ? entity.policies.find(p => p.isAllowedAction(service, action)) != null : false;
  }

  hasGrantedResource(orgUuid: string, service: string, action: string, resource: string): boolean {
    const entity = this.getEntity(orgUuid);
    return entity && entity.policies
      ? entity.policies.find(p => p.isAllowResource(service, action, resource)) != null
      : false;
  }

  isUnloaded(orgUuid) {
    return this.getValue().loadedOrgs.indexOf(orgUuid) === -1;
  }

  isLoaded(orgUuid) {
    return !this.isUnloaded(orgUuid);
  }
}

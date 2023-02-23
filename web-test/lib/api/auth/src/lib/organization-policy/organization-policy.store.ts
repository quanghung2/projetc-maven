import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { PolicyDocument } from './policty-document.model';

export interface OrganizationPolicyState extends EntityState<PolicyDocument> {
  loadedOrgs: string[];
  loaded: boolean; // called api
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_organization-policy', idKey: 'orgUuid' })
export class OrganizationPolicyStore extends EntityStore<OrganizationPolicyState> {
  constructor() {
    super({ loadedOrgs: [] });
  }
}

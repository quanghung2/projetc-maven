import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Organization } from './organization';

export interface OrganizationState extends EntityState<Organization> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_organization', idKey: 'uuid' })
export class OrganizationStore extends EntityStore<OrganizationState> {
  constructor() {
    super();
  }
}

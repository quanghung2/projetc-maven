import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Organization } from '../organization/organization';

export interface ServicedOrganizationState extends EntityState<Organization> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'serviced-organization', idKey: 'uuid' })
export class ServicedOrganizationStore extends EntityStore<ServicedOrganizationState> {
  constructor() {
    super();
  }
}

import { Injectable } from '@angular/core';
import { ID, QueryEntity } from '@datorama/akita';
import { OrganizationState, OrganizationStore } from './organization.store';

@Injectable({ providedIn: 'root' })
export class OrganizationQuery extends QueryEntity<OrganizationState> {
  constructor(protected override store: OrganizationStore) {
    super(store);
  }

  selectOrganization(id: ID) {
    return this.selectEntity(id);
  }
}

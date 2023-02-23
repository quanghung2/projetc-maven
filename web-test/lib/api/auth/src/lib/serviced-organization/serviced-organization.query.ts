import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ServicedOrganizationState, ServicedOrganizationStore } from './serviced-organization.store';

@Injectable({ providedIn: 'root' })
export class ServicedOrganizationQuery extends QueryEntity<ServicedOrganizationState> {
  organizations$ = this.selectAll();

  constructor(protected override store: ServicedOrganizationStore) {
    super(store);
  }
}

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Integration } from './integration.model';

export interface IntegrationState extends EntityState<Integration> {
  approvalBot: string; // chatUserId
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_integration', idKey: 'uuid' })
export class IntegrationStore extends EntityStore<IntegrationState> {
  constructor() {
    super();
  }
}

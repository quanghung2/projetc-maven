import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { PortalConfig } from './portal-config.model';
import { PortalConfigStore } from './portal-config.store';

@Injectable({ providedIn: 'root' })
export class PortalConfigQuery extends Query<PortalConfig> {
  portalConfig$ = this.select();

  constructor(protected override store: PortalConfigStore) {
    super(store);
  }
}

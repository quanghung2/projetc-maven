import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { OrgConfig } from './org-config.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_orgConfig', cache: { ttl: 10 * 60 * 1000 } })
export class OrgConfigStore extends Store<OrgConfig> {
  constructor() {
    super(new OrgConfig());
  }

  updateWithCacheable(state: OrgConfig) {
    this.update(state);
    this.setHasCache(true);
  }
}

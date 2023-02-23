import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { PortalConfig } from './portal-config.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_portal_config' })
export class PortalConfigStore extends Store<PortalConfig> {
  constructor() {
    super(new PortalConfig({}));
  }
}

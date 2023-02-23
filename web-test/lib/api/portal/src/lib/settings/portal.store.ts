import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { PortalData } from './portal.model';

function createInitState(): PortalData {
  return <PortalData>{};
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'portal_config', idKey: 'uuid' })
export class PortalStore extends Store<PortalData> {
  constructor() {
    super(createInitState());
  }
}

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ApplicationV3 } from './app';

export interface ApplicationV3State extends EntityState<ApplicationV3> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'app_appv3', idKey: 'id' })
export class AppStore extends EntityStore<ApplicationV3State> {
  constructor() {
    super({});
  }
}

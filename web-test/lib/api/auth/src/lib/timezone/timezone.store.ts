import { Injectable } from '@angular/core';
import { StoreConfig, EntityStore, EntityState } from '@datorama/akita';
import { Timezone } from './timezone';

export interface TimezoneState extends EntityState<Timezone> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'auth_timezone',
  idKey: 'uuid',
  cache: {
    ttl: 3600000 * 12
  }
})
export class TimezoneStore extends EntityStore<TimezoneState> {
  constructor() {
    super();
  }
}

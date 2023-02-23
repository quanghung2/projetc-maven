import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ScheduleUW } from './schedule.model';

export interface ScheduleUWState extends EntityState<ScheduleUW> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_schedule', idKey: 'identityUuid', cache: { ttl: 3600000 } })
export class ScheduleStore extends EntityStore<ScheduleUWState> {
  constructor() {
    super();
  }
}

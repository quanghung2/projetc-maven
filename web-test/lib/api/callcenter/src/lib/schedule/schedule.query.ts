import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ScheduleStore, ScheduleUWState } from './schedule.store';

@Injectable({ providedIn: 'root' })
export class ScheduleQuery extends QueryEntity<ScheduleUWState> {
  constructor(protected override store: ScheduleStore) {
    super(store);
  }

  selectByIdentityUuid(identityUuid: string) {
    return this.selectEntity(identityUuid);
  }

  getByIdentityUuid(identityUuid: string) {
    return this.getEntity(identityUuid);
  }
}

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { GroupHolidays } from './group-holidays.model';

export interface GroupHolidaysState extends EntityState<GroupHolidays> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'Leave_group-holidays', idKey: 'groupUuid' })
export class GroupHolidaysStore extends EntityStore<GroupHolidaysState> {
  constructor() {
    super();
  }
}

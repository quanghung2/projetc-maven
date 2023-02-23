import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { GroupHolidaysState, GroupHolidaysStore } from './group-holidays.store';

@Injectable({ providedIn: 'root' })
export class GroupHolidaysQuery extends QueryEntity<GroupHolidaysState> {
  constructor(protected override store: GroupHolidaysStore) {
    super(store);
  }
}

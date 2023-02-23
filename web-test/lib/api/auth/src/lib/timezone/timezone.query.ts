import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { TimezoneState, TimezoneStore } from './timezone.store';

@Injectable({ providedIn: 'root' })
export class TimezoneQuery extends QueryEntity<TimezoneState> {
  timezone$ = this.selectAll();

  constructor(protected override store: TimezoneStore) {
    super(store);
  }
}

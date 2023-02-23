import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { StaffState, StaffStore } from './staff.store';

@Injectable({ providedIn: 'root' })
export class StaffQuery extends QueryEntity<StaffState> {
  staffs$ = this.selectAll();

  constructor(protected override store: StaffStore) {
    super(store);
  }
}

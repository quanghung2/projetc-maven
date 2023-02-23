import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Staff } from './staff.model';

export interface StaffState extends EntityState<Staff> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'bizphone_staff', idKey: 'uuid' })
export class StaffStore extends EntityStore<StaffState> {
  constructor() {
    super();
  }
}

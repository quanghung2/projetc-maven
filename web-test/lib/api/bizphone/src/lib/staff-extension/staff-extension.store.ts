import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { StaffExtension } from './staff-extension.model';

export interface StaffExtensionState extends EntityState<StaffExtension> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'bizphone_staff_extension', idKey: 'identityUuid' })
export class StaffExtensionStore extends EntityStore<StaffExtensionState> {
  constructor() {
    super();
  }
}

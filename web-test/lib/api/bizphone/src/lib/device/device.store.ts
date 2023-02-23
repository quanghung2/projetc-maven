import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Device } from './device.model';

export interface DeviceState extends EntityState<Device> {
  isAutoProvisioning: boolean;
  isDeleting: boolean;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'device' })
export class DeviceStore extends EntityStore<DeviceState> {
  constructor() {
    super();
  }
}

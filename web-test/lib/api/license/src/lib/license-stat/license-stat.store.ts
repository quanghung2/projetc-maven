import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { LicenseStatistic } from './license-stat.model';

export interface LicenseStatState extends EntityState<LicenseStatistic>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'license_license-stat', idKey: 'sku' })
export class LicenseStatStore extends EntityStore<LicenseStatState> {
  constructor() {
    super();
  }
}

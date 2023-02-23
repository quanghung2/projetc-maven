import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Bundle } from './bundle.model';

export interface BundleState extends EntityState<Bundle> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'license_bundle' })
export class BundleStore extends EntityStore<BundleState> {
  constructor() {
    super();
  }
}

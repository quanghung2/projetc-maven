import { Injectable } from '@angular/core';
import { BundleStatus } from '@b3networks/api/license';
import { Store, StoreConfig } from '@datorama/akita';
import { AppState, BundleFilter, createAppState, OrderFilter } from './app-state.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'app-state' })
export class AppStateStore extends Store<AppState> {
  constructor() {
    super(
      createAppState({
        bundleFilter: <BundleFilter>{ currentPage: 0, status: BundleStatus.active },
        orderFilter: <OrderFilter>{ currentPage: 0 }
      })
    );
  }
}

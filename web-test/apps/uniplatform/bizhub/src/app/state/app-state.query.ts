import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AppState } from './app-state.model';
import { AppStateStore } from './app-state.store';

@Injectable({ providedIn: 'root' })
export class AppStateQuery extends Query<AppState> {
  orderFilter$ = this.select('orderFilter');

  constructor(protected override store: AppStateStore) {
    super(store);
  }

  get orderFilter() {
    return this.getValue().orderFilter;
  }

  get bundleFilter() {
    return this.getValue().bundleFilter;
  }
}

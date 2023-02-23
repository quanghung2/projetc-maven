import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AppState } from './app-state.model';
import { AppStateStore } from './app-state.store';

@Injectable({ providedIn: 'root' })
export class AppStateQuery extends Query<AppState> {
  loading$ = this.select('loading');
  showSidebar$ = this.select('showSidebar');

  constructor(protected override store: AppStateStore) {
    super(store);
  }
}

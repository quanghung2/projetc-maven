import { Injectable } from '@angular/core';
import { AppState } from './app-state.model';
import { AppStateStore } from './app-state.store';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  constructor(private store: AppStateStore) {}

  toggleAppLoading(loading: boolean) {
    this.store.update({ loading: loading });
  }

  udpateAppState(filter: Partial<AppState>) {
    this.store.update(filter);
  }
}

import { Injectable } from '@angular/core';
import { AppStateStore } from './app-state.store';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  constructor(private appStateStore: AppStateStore) {}

  toggleSidebar(show: boolean) {
    this.appStateStore.update({ showSidebar: show });
  }

  toggleAppLoading(loading: boolean) {
    this.appStateStore.update({ loading: loading });
  }
}

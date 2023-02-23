import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { AppConfig } from './app-state.model';
import { AppStateStore } from './app-state.store';

@Injectable({ providedIn: 'root' })
export class AppStateQuery extends Query<AppConfig> {
  constructor(protected override store: AppStateStore) {
    super(store);
  }

  getName() {
    return this.getValue().name;
  }
}

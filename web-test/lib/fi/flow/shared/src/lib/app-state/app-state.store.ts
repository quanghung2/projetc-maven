import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { AppConfig } from './app-state.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_appState' })
export class AppStateStore extends Store<AppConfig> {
  constructor() {
    super({ name: null });
  }

  setAppConfig(config: AppConfig) {
    this.update({ name: config.name });
  }
}

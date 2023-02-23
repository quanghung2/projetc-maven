import { Injectable } from '@angular/core';
import { AppConfig } from './app-state.model';
import { AppStateStore } from './app-state.store';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  constructor(private store: AppStateStore) {}

  setAppConfig(config: AppConfig) {
    this.store.setAppConfig(config);
  }
}

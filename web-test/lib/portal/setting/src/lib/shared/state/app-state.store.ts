import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { AppState, createAppState } from './app-state.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'app-state' })
export class AppStateStore extends Store<AppState> {
  constructor() {
    super(
      createAppState({
        assignedFeatureCodes: []
      })
    );
  }
}

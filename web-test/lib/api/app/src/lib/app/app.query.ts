import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ApplicationV3State, AppStore } from './app.store';

@Injectable({ providedIn: 'root' })
export class AppQuery extends QueryEntity<ApplicationV3State> {
  constructor(protected override store: AppStore) {
    super(store);
  }
}

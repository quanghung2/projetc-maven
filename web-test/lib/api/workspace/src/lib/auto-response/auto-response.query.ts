import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AutoResponseState, AutoResponseStore } from './auto-response.store';

@Injectable({ providedIn: 'root' })
export class AutoResponseQuery extends QueryEntity<AutoResponseState> {
  autoResponses$ = this.selectAll();
  isLoading$ = this.selectLoading();

  constructor(protected override store: AutoResponseStore) {
    super(store);
  }
}

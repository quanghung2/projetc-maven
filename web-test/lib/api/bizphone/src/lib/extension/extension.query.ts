import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ExtensionState, ExtensionStore } from './extension.store';

@Injectable({ providedIn: 'root' })
export class ExtensionQuery extends QueryEntity<ExtensionState> {
  selectAll$ = this.selectAll({
    sortBy: 'extKeyInNumber'
  });

  filter$ = this.select(state => state.ui);

  constructor(protected override store: ExtensionStore) {
    super(store);
  }
}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { TxnState, TxnStore } from './txn.store';

@Injectable({ providedIn: 'root' })
export class TxnQuery extends QueryEntity<TxnState> {
  activeCalls$ = this.selectAll();

  filter$ = this.select(state => state.filter);

  constructor(protected override store: TxnStore) {
    super(store);
  }
}

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Txn, TxnFilter } from './model/txn.model';

export interface TxnState extends EntityState<Txn> {
  filter: TxnFilter;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_txn', idKey: 'txnUuid' })
export class TxnStore extends EntityStore<TxnState> {
  constructor() {
    super();
  }

  updateFilter(filter: TxnFilter) {
    this.update(state => ({ ...state, filter: filter }));
  }
}

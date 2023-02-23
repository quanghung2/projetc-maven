import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { PrivateNoteState, PrivateNoteStore } from './private-note.store';

@Injectable({ providedIn: 'root' })
export class PrivateNoteQuery extends QueryEntity<PrivateNoteState> {
  privateNotes$ = this.selectAll({ sortBy: 'createdAt', sortByOrder: Order.DESC });
  isLoading$ = this.selectLoading();

  constructor(protected override store: PrivateNoteStore) {
    super(store);
  }

  getHasMore() {
    return this.getValue().hasMore;
  }

  getPage() {
    return this.getValue().page;
  }

  seletePrivateNotesByTxns(txns: string[]) {
    return this.selectAll({
      filterBy: entity => txns.includes(entity.txnUuid),
      sortBy: 'createdAt',
      sortByOrder: Order.DESC
    });
  }
}

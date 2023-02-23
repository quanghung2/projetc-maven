import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { InboxesState, InboxesStore } from './inboxes.store';

@Injectable({ providedIn: 'root' })
export class InboxesQuery extends QueryEntity<InboxesState> {
  all$ = this.selectAll();

  constructor(protected override store: InboxesStore) {
    super(store);
  }
}

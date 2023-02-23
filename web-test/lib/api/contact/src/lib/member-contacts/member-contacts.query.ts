import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { ContactState, MemberContactsStore } from './member-contacts.store';

const DEFAULT_SIZE = 5;
@Injectable({ providedIn: 'root' })
export class MemberContactsQuery extends Query<ContactState> {
  blackList$ = this.select(state => state.blacklist);
  whiteList$ = this.select(state => state.whitelist);

  constructor(protected override store: MemberContactsStore) {
    super(store);
  }
}

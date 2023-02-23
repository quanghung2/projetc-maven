import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { MeState, MeStore } from './me.store';

@Injectable({ providedIn: 'root' })
export class MeQuery extends Query<MeState> {
  me$ = this.select(state => state.me);

  constructor(protected override store: MeStore) {
    super(store);
  }

  getMe() {
    return this.getValue().me;
  }
}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { PinnedappState, PinnedappStore } from './pinnedapp.store';

@Injectable({ providedIn: 'root' })
export class PinnedappQuery extends QueryEntity<PinnedappState> {
  constructor(protected override store: PinnedappStore) {
    super(store);
  }
}

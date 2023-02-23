import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Pinnedapp } from './pinnedapp.model';

export interface PinnedappState extends EntityState<Pinnedapp> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'portal_pinnedapp' })
export class PinnedappStore extends EntityStore<PinnedappState> {
  constructor() {
    super();
  }
}

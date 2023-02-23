import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Inbox } from './inboxes.model';

export interface InboxesState extends EntityState<Inbox> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'inbox-inboxes', idKey: 'uuid' })
export class InboxesStore extends EntityStore<InboxesState> {
  constructor() {
    super();
  }
}

import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ChannelState, ChannelStore } from './channel.store';

@Injectable({ providedIn: 'root' })
export class ChannelQuery extends QueryEntity<ChannelState> {
  constructor(protected override store: ChannelStore) {
    super(store);
  }

  isEmpty() {
    return this.getAll().length === 0;
  }
}

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Channel } from './channel.model';

export interface ChannelState extends EntityState<Channel> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'partner_channel',
  idKey: 'partnerUuid'
})
export class ChannelStore extends EntityStore<ChannelState> {
  constructor() {
    super();
  }
}

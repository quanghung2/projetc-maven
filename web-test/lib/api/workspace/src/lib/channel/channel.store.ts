import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { ChannelUI } from './model/channel-ui.model';
import { Channel, ChatChannelStoreName, RecentChannel } from './model/channel.model';

export interface ChannelState extends EntityState<Channel>, ActiveState {
  recentChannels: RecentChannel[];
  loaded: boolean; // called getPublicChannels api
  loadedMineChannel: boolean; // called getChannelsWithMe api
  loadedPersonalChannel: boolean; // called getPersonalChannels api
  showAll: boolean;
  isDisconnected: boolean;
}

export type ChannelUIState = EntityState<ChannelUI>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: ChatChannelStoreName, idKey: 'id' })
export class ChannelStore extends EntityStore<ChannelState> {
  override ui: EntityUIStore<ChannelUIState>;
  constructor() {
    super({
      recentChannels: []
    });

    this.createUIStore({}, { deepFreezeFn: obj => obj }).setInitialEntityState(
      entity =>
        <ChannelUI>{
          loaded: false,
          loadedFirst: false,
          viewingOlderMessage: false,
          file: {
            loaded: false,
            page: 1,
            perPage: 10,
            hasMore: true
          },
          previewHistory: {
            loadedFirst: false,
            hasMoreTop: false,
            hasMoreBottom: false
          }
        }
    );
  }
}

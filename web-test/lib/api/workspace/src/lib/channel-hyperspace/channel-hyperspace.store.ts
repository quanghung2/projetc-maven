import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, EntityUIStore, StoreConfig } from '@datorama/akita';
import { ChannelHyperspaceUI } from './model/channel-hyperspace-ui.model';
import { ChannelHyperspace, ChatChannelHyperspaceStoreName } from './model/channel-hyperspace.model';

export interface ChannelHyperspaceState extends EntityState<ChannelHyperspace>, ActiveState {
  hypersLoaded: string[]; // called getPublicChannels api
  isDisconnected: boolean;
}

export type ChannelHyperspaceUIState = EntityState<ChannelHyperspaceUI>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: ChatChannelHyperspaceStoreName, idKey: 'id' })
export class ChannelHyperspaceStore extends EntityStore<ChannelHyperspaceState> {
  override ui: EntityUIStore<ChannelHyperspaceUIState>;

  constructor() {
    super({
      hypersLoaded: []
    });

    this.createUIStore({}, { deepFreezeFn: obj => obj }).setInitialEntityState(
      entity =>
        <ChannelHyperspaceUI>{
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

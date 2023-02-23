import { Injectable } from '@angular/core';
import { EntityUIQuery, QueryEntity } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { ChannelType } from './../channel/model/enum-channel.model';
import { ChannelHyperspaceState, ChannelHyperspaceStore, ChannelHyperspaceUIState } from './channel-hyperspace.store';
import { ChannelHyperspaceUI } from './model/channel-hyperspace-ui.model';
import { ChannelHyperspace } from './model/channel-hyperspace.model';

@Injectable({ providedIn: 'root' })
export class ChannelHyperspaceQuery extends QueryEntity<ChannelHyperspaceState> {
  override ui: EntityUIQuery<ChannelHyperspaceUIState>;

  isDisconnected$ = this.select('isDisconnected');

  constructor(protected override store: ChannelHyperspaceStore) {
    super(store);
    this.createUIQuery();
  }

  storeLoaded(hyperspaceId: string) {
    return this.store.getValue()?.hypersLoaded?.includes(hyperspaceId);
  }

  storeIsDisconnected() {
    return this.store.getValue()?.isDisconnected;
  }

  getChannel(channelId: string) {
    return this.getEntity(channelId);
  }

  selectUIState<K extends keyof ChannelHyperspaceUI>(id: string, property: K) {
    return this.ui.selectEntity(id, property);
  }

  selectPropertyChannel<K extends keyof ChannelHyperspace>(id: string, property: K) {
    return this.selectEntity(id, property);
  }

  selectParticipantChannel(channelId: string) {
    return this.selectEntity(channelId, entity => [
      ...entity?.participantCurrentOrg,
      ...entity?.participantOtherOrg
    ]).pipe(map(x => x || []));
  }

  getChannelUiState(channelId: string) {
    return this.ui.getEntity(channelId);
  }

  selectChannelByUser(hyperspaceId: string) {
    const activeChannelId = this.getActiveId();
    return this.selectAll({
      filterBy: entity => entity.hyperspaceId === hyperspaceId && (!entity.archivedAt || entity.id === activeChannelId)
    });
  }

  selectCountUnread(hyperspaceId: string) {
    return this.selectCount(entity => {
      const dm = entity.hyperspaceId === hyperspaceId && entity.type === ChannelType.dm && entity.unreadCount > 0;
      if (dm) {
        return dm;
      }
      return (
        entity.hyperspaceId === hyperspaceId &&
        entity.type === ChannelType.gc &&
        entity?.mentionCount > 0 &&
        !entity.archivedAt &&
        entity.isMyChannel
      );
    });
  }

  resetChannelViewStateHistory(channelId: string | string[]) {
    this.store.ui.update(channelId, entity => ({
      ...entity,
      loaded: false,
      hasMore: false,
      toMillis: undefined,
      fromMillis: undefined
    }));
  }
}

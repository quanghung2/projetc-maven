import { Injectable } from '@angular/core';
import { EntityUIQuery, QueryEntity } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { ChannelState, ChannelStore, ChannelUIState } from './channel.store';
import { ChannelUI } from './model/channel-ui.model';
import { Channel } from './model/channel.model';
import { ChannelType, NameChannelPersonal } from './model/enum-channel.model';

@Injectable({ providedIn: 'root' })
export class ChannelQuery extends QueryEntity<ChannelState> {
  override ui: EntityUIQuery<ChannelUIState>;

  loadedMineChannel$ = this.select('loadedMineChannel');
  loaded$ = this.select('loaded');
  isDisconnected$ = this.select('isDisconnected');

  constructor(protected override store: ChannelStore) {
    super(store);
    this.createUIQuery();
  }

  storeLoaded() {
    return this.store.getValue()?.loaded;
  }

  storeIsDisconnected() {
    return this.store.getValue()?.isDisconnected;
  }

  getPersonalChannel(channelName: NameChannelPersonal | string) {
    return this.getAll({
      filterBy: entity => entity.type === ChannelType.PERSONAL && entity.name === channelName
    })[0];
  }

  selectPersonalChannel(channelName: NameChannelPersonal | string) {
    return this.selectAll({
      filterBy: entity => entity.type === ChannelType.PERSONAL && entity.name === channelName,
      limitTo: 1
    }).pipe(map(x => x[0]));
  }

  getGeneral() {
    return this.getAll({
      filterBy: entity => entity.name === 'general',
      limitTo: 1
    });
  }

  selectGeneral() {
    return this.selectAll({
      filterBy: entity => entity.name === 'general',
      limitTo: 1
    });
  }

  getDirectChannels() {
    return this.getAll({
      filterBy: entity => entity.type === ChannelType.dm
    });
  }

  selectPropertyChannel<K extends keyof Channel>(id: string, property: K) {
    return this.selectEntity(id, property);
  }

  getChannelUiState(channelId: string) {
    return this.ui.getEntity(channelId);
  }

  selectChannelUiState(channelId: string) {
    return this.ui.selectEntity(channelId);
  }

  selectUIState<K extends keyof ChannelUI>(id: string, property: K) {
    return this.ui.selectEntity(id, property);
  }

  getChannel(channelId: string) {
    return this.getEntity(channelId);
  }

  selectChannel(channelId: string) {
    return this.selectEntity(channelId);
  }

  // User.userUuid
  findChannelDirectChatWithMe(userUuid: string) {
    const find = this.getAll({
      filterBy: entity => entity.type === ChannelType.dm && entity.directChatUsers.otherUuid === userUuid,
      limitTo: 1
    });
    return find ? find[0] : null;
  }

  selectUnreadBadge(userUuids: string[]) {
    return this.selectCount(entity => {
      const dm = entity.type === ChannelType.dm && entity.unreadCount > 0;
      if (dm) {
        // because direct chat with disactive user don't display
        if (userUuids.includes(entity?.directChatUsers?.otherUuid)) {
          return dm;
        }
        return false;
      }

      const myChannel = entity.isMyChannel && !entity.isArchived;
      const gc = myChannel && entity.type === ChannelType.gc && entity.mentionCount > 0;
      return gc;
    }).pipe(map(count => count > 0));
  }
}

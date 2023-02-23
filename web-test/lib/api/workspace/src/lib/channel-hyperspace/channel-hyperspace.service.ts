import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_V3_PREFIX } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { map, tap } from 'rxjs/operators';
import { ChatMessage } from '../chat/chat-message.model';
import { Privacy } from '../enums.model';
import { StarService } from '../star/star.service';
import { ChannelType } from './../channel/model/enum-channel.model';
import { ChannelHyperspaceQuery } from './channel-hyperspace.query';
import { ChannelHyperspaceState, ChannelHyperspaceStore } from './channel-hyperspace.store';
import {
  ReqCreateChannelHyper,
  ReqUpdateMetaDataHyper,
  ReqUpdateUsersChannelHyper
} from './model/channel-hyperspace-request.model';
import { ChannelHyperspaceUI } from './model/channel-hyperspace-ui.model';
import { ChannelHyperspace, MappingHyperData, SeenStatus } from './model/channel-hyperspace.model';

@Injectable({ providedIn: 'root' })
export class ChannelHyperspaceService {
  constructor(
    private http: HttpClient,
    private store: ChannelHyperspaceStore,
    private query: ChannelHyperspaceQuery,
    private starService: StarService
  ) {}

  createChannel(req: ReqCreateChannelHyper, mapping: MappingHyperData) {
    return this.http
      .post<{ hyperchannel: ChannelHyperspace }>(
        `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/hyperspace/hyperchannel/new`,
        req
      )
      .pipe(
        map(channel =>
          new ChannelHyperspace({
            ...channel.hyperchannel,
            hyperspaceId: req.hyperspaceId
          }).mappingModel(mapping)
        ),
        tap(channel => {
          this.store.add(channel);
        })
      );
  }

  // now support description
  updateChannelHyper(req: ReqUpdateMetaDataHyper) {
    return this.http.post<ChannelHyperspace>(
      `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/hyperspace/hyperchannel/updateMetadata`,
      req
    );
  }

  updateUsersChannelHyper(req: ReqUpdateUsersChannelHyper) {
    return this.http.post<ChannelHyperspace>(
      `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/hyperspace/hyperchannel/updateUsers`,
      req
    );
  }

  getMines(hyperspaceId: string, mapping: MappingHyperData) {
    return this.http
      .post<{ hyperchannels: { hyperchannel: ChannelHyperspace; seenStatus: SeenStatus }[] }>(
        `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/hyperspace/hyperchannel/getMines`,
        {
          hyperspaceId
        }
      )
      .pipe(
        map(data => data.hyperchannels || []),
        map(list =>
          list?.map(channel => {
            const model = new ChannelHyperspace({
              ...channel.hyperchannel,
              hyperspaceId: hyperspaceId,
              unreadCount: +channel?.seenStatus?.unreadCount,
              mentionCount: +channel?.seenStatus?.mentionCount,
              lastSeenMillis: +channel?.seenStatus?.lastSeenMillis
            }).mappingModel(mapping);

            if (!model.hasOwnProperty('archivedBy')) {
              model.archivedBy = null;
            }

            if (!model.hasOwnProperty('archivedAt')) {
              model.archivedAt = null;
            }
            return model;
          })
        ),
        tap(channels => {
          this.store.upsertMany(channels, {
            baseClass: ChannelHyperspace
          });
          this.starService.getStarChannels().subscribe();
        })
      );
  }

  getDetails(hyperspaceId: string, hyperchannelId: string, mapping: MappingHyperData) {
    return this.http
      .post<{ hyperchannel: ChannelHyperspace }>(
        `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/hyperspace/hyperchannel/getOne`,
        {
          hyperspaceId,
          hyperchannelId
        }
      )
      .pipe(
        map(data => data.hyperchannel || []),
        map(data => {
          const model = new ChannelHyperspace({
            ...data,
            hyperspaceId: hyperspaceId
          }).mappingModel(mapping);

          if (!model.hasOwnProperty('archivedBy')) {
            model.archivedBy = null;
          }

          if (!model.hasOwnProperty('archivedAt')) {
            model.archivedAt = null;
          }
          return model;
        }),
        tap(channel => {
          this.store.upsertMany([channel], {
            baseClass: ChannelHyperspace
          });
          this.starService.getStarChannels().subscribe();
        })
      );
  }

  getPublicChannels(hyperspaceId: string) {
    return this.http
      .post<{ hyperchannels: { id: string; name: string }[] }>(
        `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/hyperspace/hyperchannel/getAllPublicNames`,
        { hyperspaceId }
      )
      .pipe(
        map(data => data.hyperchannels || []),
        map(list =>
          list?.map(
            channel =>
              <ChannelHyperspace>{
                hyperspaceId: hyperspaceId,
                name: channel.name,
                id: channel.id,
                privacy: Privacy.public,
                type: ChannelType.gc
              }
          )
        ),
        tap(channels => {
          this.store.upsertMany(channels, {
            baseClass: ChannelHyperspace
          });

          const list = [...this.store.getValue()?.hypersLoaded] || [];
          if (!list.includes(hyperspaceId)) {
            list.push(hyperspaceId);
            this.store.update({
              hypersLoaded: list
            });
          }
        })
      );
  }

  // ==============  handle store
  updateChannelViewState(channelId: string | string[], state: Partial<ChannelHyperspaceUI>) {
    this.store.ui.update(channelId, entity => ({
      ...entity,
      ...state
    }));
  }

  resetChannelViewStateHistory(channelId: string | string[]) {
    this.store.ui.update(channelId, entity => ({
      ...entity,
      loaded: false,
      loadedFirst: false,
      hasMore: false,
      toMillis: undefined,
      fromMillis: undefined
    }));
  }

  updateChannelData(channelId: string | string[], state: Partial<ChannelHyperspace>) {
    this.store.update(channelId, entity => ({
      ...entity,
      ...state
    }));
  }

  setActive(channelId: string | ID) {
    this.store.setActive(channelId);
  }

  removeActive(channelId: string | ID) {
    this.store.removeActive(channelId);
  }

  closeConversation(id: string) {
    if (!id) {
      return;
    }
    const channel = this.query.getEntity(id);
    if (!channel) {
      return;
    }

    if (channel.privacy === Privacy.private) {
      this.store.remove(id);
    }
  }

  updateLastMessage(convoId: string, message: ChatMessage) {
    if (!this.query.hasEntity(convoId)) {
      return;
    }

    this.store.update(convoId, { lastMessage: message });

    const ui = this.query.ui.getEntity(convoId);
    if (!this.query.storeIsDisconnected() && !!ui?.toMillis && ui.toMillis < message.ts) {
      this.store.ui.update(convoId, { toMillis: message.ts });
    }
  }

  markSeen(convoId: string) {
    this.store.update(convoId, { unreadCount: 0, mentionCount: 0 });
  }

  updateChannel(channels: ChannelHyperspace[]) {
    this.store.upsertMany(channels, { baseClass: ChannelHyperspace });
  }

  updateStateStore(data: Partial<ChannelHyperspaceState>) {
    this.store.update(data);
  }
}

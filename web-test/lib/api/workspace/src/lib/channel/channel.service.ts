import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_V2_PREFIX, CHAT_PUBLIC_V3_PREFIX } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { ChatMessage } from '../chat/chat-message.model';
import { Privacy } from '../enums.model';
import { StarService } from '../star/star.service';
import { ChannelQuery } from './channel.query';
import { ChannelState, ChannelStore } from './channel.store';
import { ChannelUI } from './model/channel-ui.model';
import {
  Channel,
  ChannelPersonalResponse,
  CopyMessageRequest,
  CreateConvoGroupReq,
  RecentChannel,
  UpdateChannelReq
} from './model/channel.model';
import { ChannelType, NameChannelPersonal } from './model/enum-channel.model';
import { MessageSearchResult, RequestSearchCriteria } from './model/search-criteria.model';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  convoNotFound: string[] = ['undefined', 'null'];
  constructor(
    private http: HttpClient,
    private store: ChannelStore,
    private query: ChannelQuery,
    private starService: StarService
  ) {}

  search(filter: RequestSearchCriteria): Observable<MessageSearchResult> {
    return this.http.post<MessageSearchResult>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/message/search`, filter);
  }

  createChannel(req: CreateConvoGroupReq, meChatUuid: string) {
    return this.http.post<Channel>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel`, req).pipe(
      map(channel => new Channel(channel).withMeUuid(meChatUuid)),
      tap(channel => {
        this.store.add(channel);
      })
    );
  }

  getChannelsWithMe(meChatUuid: string, personalChannels = false): Observable<Channel[]> {
    this.store.setLoading(true);
    let params = new HttpParams();
    if (personalChannels) {
      params = params.append('personalChannels', 'true');
    }

    return this.http.get<Channel[]>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel`, { params: params }).pipe(
      finalize(() => this.store.setLoading(false)),
      map(list =>
        list?.map(channel => {
          const model = new Channel(channel).withMeUuid(meChatUuid);
          if (!channel.hasOwnProperty('archivedBy')) {
            model.archivedBy = null;
          }

          if (!channel.hasOwnProperty('archivedAt')) {
            model.archivedAt = null;
          }
          return model;
        })
      ),
      tap(channels => {
        this.store.upsertMany(channels, {
          baseClass: Channel
        });

        this.starService.getStarChannels().subscribe();
        this.store.update({ loadedMineChannel: true });
      })
    );
  }

  getPublicChannels(): Observable<Channel[]> {
    this.store.setLoading(true);
    return this.http.get<Channel[]>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/public`).pipe(
      finalize(() => this.store.setLoading(false)),
      map(list =>
        list?.map(
          channel =>
            <Channel>{
              name: channel.name,
              id: channel.id,
              privacy: Privacy.public,
              type: ChannelType.gc
            }
        )
      ),
      tap(channels => {
        this.store.upsertMany(channels, {
          baseClass: Channel
        });
        this.store.update({ loaded: true });
      })
    );
  }

  getDetails(channelId: string, meChatUuid: string): Observable<Channel> {
    return this.http.get<Channel>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/${channelId}`).pipe(
      map(channel => new Channel(channel).withMeUuid(meChatUuid)),
      tap(
        channel => {
          if (!channel.hasOwnProperty('archivedBy')) {
            channel.archivedBy = null;
          }

          if (!channel.hasOwnProperty('archivedAt')) {
            channel.archivedAt = null;
          }

          this.store.upsert(channel.id, channel, { baseClass: Channel });
          this.starService.getStarChannels().subscribe();
        },
        _ => this.convoNotFound.push(channelId)
      )
    );
  }

  getPersonalChannels(types: NameChannelPersonal[] | string[]): Observable<Channel[]> {
    return this.http
      .post<ChannelPersonalResponse>(`${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/namespace/channel/getPersonal`, {
        // empty = all
        types: types
      })
      .pipe(
        map(resp => resp?.channels || {}),
        map(data => {
          const channels: Channel[] = [];
          Object.keys(data).forEach(key => {
            if (data[key] && !!data[key].details) {
              const model = new Channel({
                ...data[key].details,
                name: key,
                privacy: Privacy.private,
                type: ChannelType.PERSONAL
              });
              if (!model.hasOwnProperty('archivedBy')) {
                model.archivedBy = null;
              }

              if (!model.hasOwnProperty('archivedAt')) {
                model.archivedAt = null;
              }
              channels.push(model);
            }
          });

          return channels;
        }),
        tap(channels => {
          this.store.upsertMany(channels, {
            baseClass: Channel
          });
          this.store.update({ getPersonalChannels: true });
        })
      );
  }

  updateRecentChannels(switchChannel: string) {
    return this.http
      .post<{ recentChannels: { channelId: string; millis: string }[] }>(
        `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/namespace/channel/switchChannel`,
        {
          channelId: switchChannel
        }
      )
      .pipe(
        map(x => x?.recentChannels || []),
        tap(recentChannel => {
          this.store.update({
            recentChannels: recentChannel?.map(
              x =>
                <RecentChannel>{
                  id: x.channelId,
                  date: +x.millis || new Date().getTime()
                }
            )
          });
        })
      );
  }

  addOrRemoveParticipants(channelId: string, req: UpdateChannelReq) {
    return this.http.post<void>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/${channelId}/participants`, req);
  }

  archivedOrUnarchiveChannel(channelId: string, isArchived) {
    return this.http.put<void>(
      `${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/${channelId}/${isArchived ? 'archived' : 'unarchived'}`,
      {}
    );
  }

  updateNameOrDescriptionChannel(channelId: string, req: UpdateChannelReq) {
    return this.http.put<void>(`${CHAT_PUBLIC_V3_PREFIX}/public/_tc/channel/${channelId}`, req);
  }

  copyMessage(req: CopyMessageRequest) {
    return this.http.post<{ message: ChatMessage }>(
      `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/namespace/message/copy`,
      req
    );
  }

  deleteCopy(req: CopyMessageRequest) {
    return this.http.post<{ message: ChatMessage }>(
      `${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/namespace/message/deleteCopy`,
      req
    );
  }

  updateChannelViewState(channelId: string | string[], state: Partial<ChannelUI>) {
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

  updateChannel(channels: Channel[]) {
    this.store.upsertMany(channels, { baseClass: Channel });
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

  markSeen(convoId: string, lastSeenMillis: number) {
    this.store.update(convoId, {
      unreadCount: 0,
      mentionCount: 0,
      lastSeenMillis: null
    });

    this.updateChannelViewState(convoId, {
      newMessage: null,
      lastSeenMsgID: null
    });
  }

  updateLastMessage(convoId: string, message: ChatMessage) {
    if (!this.query.hasEntity(convoId)) {
      return;
    }

    this.store.update(convoId, { lastMessage: message });
  }

  updateStateStore(data: Partial<ChannelState>) {
    this.store.update(data);
  }

  updateNavigateToMsg(channelId: string, messageId: string) {
    const current = this.query.ui.getEntity(channelId)?.jumpMessageId;
    if (current === messageId) {
      // reset value
      this.store.ui.update(channelId, {
        jumpMessageId: null
      });
    }
    this.store.ui.update(channelId, {
      jumpMessageId: messageId
    });
  }
}

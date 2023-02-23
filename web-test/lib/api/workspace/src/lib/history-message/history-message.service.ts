import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_PREFIX, CHAT_PUBLIC_V2_PREFIX, CHAT_PUBLIC_V3_PREFIX } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { of } from 'rxjs';
import { filter, finalize, map, tap } from 'rxjs/operators';
import { ChannelHyperspaceService } from '../channel-hyperspace/channel-hyperspace.service';
import { ChannelQuery } from '../channel/channel.query';
import { ChannelService } from '../channel/channel.service';
import { ChatMessage } from '../chat/chat-message.model';
import { ConversationGroupQuery } from '../conversation-group/conversation-group.query';
import { ConversationGroupService } from '../conversation-group/conversation-group.service';
import { ConversationGroup, ConversationGroupUI } from '../conversation-group/model/conversation-group.model';
import { ConvoType } from '../enums.model';
import { ChannelHyperspaceQuery } from './../channel-hyperspace/channel-hyperspace.query';
import {
  ConfigStore,
  FilterConvoMessageRangeRequest,
  FilterConvoMessageReq,
  HistoryMessage,
  HistoryMessageRange
} from './history-message.model';
import { HistoryMessageQuery } from './history-message.query';
import { HistoryMessageStore } from './history-message.store';
import { SendWhatsAppRequest } from './whatsapp-integration';

@Injectable({ providedIn: 'root' })
export class HistoryMessageService {
  constructor(
    private historyMessageStore: HistoryMessageStore,
    private historyMessageQuery: HistoryMessageQuery,
    private http: HttpClient,
    private convoQuery: ConversationGroupQuery,
    private convoService: ConversationGroupService,
    private channelService: ChannelService,
    private channelQuery: ChannelQuery,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private toastService: ToastService
  ) {}

  // for conversation-group store ,same getHistoryChannel
  get(convoId: string, req?: FilterConvoMessageReq) {
    this.historyMessageStore.setLoading(true);
    let params = new HttpParams().set('conversations', req.conversations.join(',')).set('limit', String(req.limit));

    if (req.toMillis) {
      params = params.set('toMillis', String(req.toMillis));
    }
    if (req.fromMillis) {
      params = params.set('fromMillis', String(req.fromMillis));
    }

    return this.http
      .get<HistoryMessage>(`workspace/private/v1/group-conversations/${convoId}/history`, { params: params })
      .pipe(
        finalize(() => {
          this.historyMessageStore.setLoading(false);
        }),
        filter(history => !!history.messages),
        tap(history => {
          history.messages.sort((a, b) => a.ts - b.ts);
        }),
        map(history => {
          const model = new HistoryMessage(history);
          const convoStateUi = this.convoQuery.getConvoUiState(convoId);
          if (!convoStateUi.toMillis || model.toMillis >= convoStateUi.toMillis) {
            convoStateUi.toMillis = model.toMillis;
          }

          if (!convoStateUi.fromMillis || model.fromMillis <= convoStateUi.fromMillis) {
            convoStateUi.fromMillis = model.fromMillis;
            convoStateUi.hasMore = model.messages.length === req.limit;
          }
          // upsert: update or insert
          this.upsertManyMessages(model.messages);
          this.convoService.updateConvoViewState(convoId, convoStateUi);

          return model;
        })
      );
  }

  // for channel hyper store ,same get()
  getChannelHyperHistory(channelId: string, req: FilterConvoMessageReq) {
    this.historyMessageStore.setLoading(true);

    if (req.limit) {
      req.limit = String(req.limit);
    }

    if (req.toMillis) {
      req.toMillis = String(req.toMillis);
    }

    if (req.fromMillis) {
      req.fromMillis = String(req.fromMillis);
    }

    return this.http
      .post<HistoryMessage>(`${CHAT_PUBLIC_V3_PREFIX}/public/v2/_tc/hyperspace/hyperchannel/getHistory`, req)
      .pipe(
        finalize(() => this.historyMessageStore.setLoading(false)),
        map(history => {
          const model = new HistoryMessage(<HistoryMessage>{ ...history, hyperspaceId: req.hyperspaceId });
          const convoStateUi = this.channelHyperspaceQuery.getChannelUiState(channelId);

          if (!convoStateUi.toMillis || model.toMillis >= convoStateUi.toMillis) {
            convoStateUi.toMillis = model.toMillis;
          }

          if (!convoStateUi.fromMillis || model.fromMillis <= convoStateUi.fromMillis) {
            convoStateUi.fromMillis = model.fromMillis;
            convoStateUi.hasMore = model.messages.length === +req.limit;
          }
          // upsert: update or insert
          this.upsertManyMessages(model.messages);
          this.channelHyperspaceService.updateChannelViewState(channelId, convoStateUi);
          return model;
        })
      );
  }

  // for channel store ,same get()
  getChannelHistory(channelId: string, req: FilterConvoMessageReq) {
    this.historyMessageStore.setLoading(true);
    let params = new HttpParams().set('limit', String(req.limit));

    if (req.toMillis) {
      params = params.set('toMillis', String(req.toMillis));
    }
    if (req.fromMillis) {
      params = params.set('fromMillis', String(req.fromMillis));
    }

    return this.http
      .get<HistoryMessage>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/${channelId}/history`, { params: params })
      .pipe(
        finalize(() => this.historyMessageStore.setLoading(false)),
        map(history => {
          const model = new HistoryMessage(history);
          const convoStateUi = this.channelQuery.getChannelUiState(channelId);
          if (!convoStateUi.toMillis || model.toMillis >= convoStateUi.toMillis) {
            convoStateUi.toMillis = model.toMillis;
          }

          if (!convoStateUi.fromMillis || model.fromMillis <= convoStateUi.fromMillis) {
            convoStateUi.fromMillis = model.fromMillis;
            convoStateUi.hasMore = model.messages.length === req.limit;
          }
          // upsert: update or insert
          this.upsertManyMessages(model.messages);
          this.channelService.updateChannelViewState(channelId, convoStateUi);
          return model;
        })
      );
  }

  getHistoryChannelNoStore(channelId: string, req: FilterConvoMessageReq) {
    let params = new HttpParams().set('limit', String(req.limit));

    if (req.toMillis) {
      params = params.set('toMillis', String(req.toMillis));
    }
    if (req.fromMillis) {
      params = params.set('fromMillis', String(req.fromMillis));
    }

    return this.http
      .get<HistoryMessage>(`${CHAT_PUBLIC_V2_PREFIX}/public/_tc/channel/${channelId}/history`, {
        params: params
      })
      .pipe(map(history => new HistoryMessage(history)));
  }

  getV2(convoId: string, req: FilterConvoMessageReq) {
    this.historyMessageStore.setLoading(true);
    let params = new HttpParams().set('limit', String(req.limit));

    if (req.toMillis) {
      params = params.set('toMillis', String(req.toMillis));
    }
    if (req.fromMillis) {
      params = params.set('fromMillis', String(req.fromMillis));
    }

    return this.http
      .get<HistoryMessage>(`workspace/private/v2/conversations/${convoId}/histories`, { params: params })
      .pipe(
        finalize(() => this.historyMessageStore.setLoading(false)),
        map(history => new HistoryMessage({ ...history, convoUuid: convoId })),
        tap(history => {
          const convoStateUi = <ConversationGroupUI>{
            fromMillis: history.fromMillis,
            hasMore: history.messages.length === req.limit
          };

          if (this.isEmptyStore()) {
            this.historyMessageStore.set(history.messages);
            convoStateUi.toMillis = history.toMillis;
          } else {
            this.historyMessageStore.add(history.messages, { loading: false });
          }
          this.convoService.updateConvoViewState(convoId, convoStateUi);
        })
      );
  }

  getV1(convoGroup: ConversationGroup, limit: number) {
    this.historyMessageStore.setLoading(true);
    const params = new HttpParams().set('limit', String(limit));

    return this.http
      .get<HistoryMessage>(
        `workspace/private/v1/customers/conversations/${convoGroup.publicConversationId}/histories`,
        { params: params }
      )
      .pipe(
        finalize(() => this.historyMessageStore.setLoading(false)),
        map(history => new HistoryMessage({ ...history, convoUuid: convoGroup.conversationGroupId })),
        tap(history => {
          if (this.isEmptyStore()) {
            this.historyMessageStore.set(history.messages);
          } else {
            this.historyMessageStore.add(history.messages, { loading: false });
          }
        })
      );
  }

  /**
   * Support for Whatsapp convo
   * @param convoId whatsapp convo id
   * @param req
   */
  getWhatsappHistory(convoId: string, req: FilterConvoMessageReq) {
    this.historyMessageStore.setLoading(true);
    const params: any = {
      convoIds: [...req.conversations] || [],
      fromMillis: req.fromMillis,
      toMillis: req.toMillis,
      limit: req.limit
    };

    const url = `${CHAT_PUBLIC_PREFIX}/legacy/history`;
    return this.http.post<HistoryMessage>(url, params).pipe(
      finalize(() => this.historyMessageStore.setLoading(false)),
      map(history => {
        const model = new HistoryMessage(history);
        const convoStateUi = this.convoQuery.getConvoUiState(convoId);
        if (!convoStateUi.toMillis || model.toMillis >= convoStateUi.toMillis) {
          convoStateUi.toMillis = model.toMillis;
        }

        if (!convoStateUi.fromMillis || model.fromMillis <= convoStateUi.fromMillis) {
          convoStateUi.fromMillis = model.fromMillis;
          convoStateUi.hasMore = model.messages.length === req.limit;
        }

        // upsert: update or insert
        this.upsertManyMessages(model.messages);
        this.convoService.updateConvoViewState(convoId, convoStateUi);
        return model;
      })
    );
  }

  // ============== HISTORY RANGE ===================================
  getChannelRangeHistory(req: FilterConvoMessageRangeRequest, config: ConfigStore) {
    if (!config?.noLoading) {
      this.historyMessageStore.setLoading(true);
    }
    return this.http
      .post<HistoryMessageRange>(`${CHAT_PUBLIC_V2_PREFIX}/public/v2/_tc/namespace/message/range`, req)
      .pipe(
        finalize(() => {
          if (!config?.noLoading) {
            this.historyMessageStore.setLoading(false);
          }
        }),
        map(histories => {
          const model = new HistoryMessageRange(histories);
          if (!config?.isNoStore) {
            const convoStateUi = this.channelQuery.getChannelUiState(req.convoId);

            if (req.afterToSize === 0 && req.beforeFromSize === 0) {
              // case: load first
              if (!req.to && !req.from) {
                if (!req.isAsc) {
                  convoStateUi.hasMoreTop = model.messages.length !== 0;
                } else {
                  convoStateUi.hasMoreBottom = model.messages.length !== 0;
                }
              }

              // case: load more top,auto DESC
              if (req.to && !req.from) {
                convoStateUi.hasMoreTop = model.messages.length !== 0;
              }

              // case: load more bottom,auto ASC
              if (req.from && !req.to) {
                convoStateUi.hasMoreBottom = model.messages.length !== 0;
              }
            } else if (req.from === req.to) {
              // case: jump to message, load 2 directions
              const index = model.messages.findIndex(x => x.id === req.from);
              convoStateUi.hasMoreTop = index !== 0;
              convoStateUi.hasMoreBottom = index <= model.messages.length - 1;
            }
            // TODO: more case, handle when use it

            this.upsertManyMessages(model.messages);
            this.channelService.updateChannelViewState(req.convoId, convoStateUi);
          }
          return model;
        })
      );
  }

  addMessage(message: ChatMessage): boolean {
    // with call message. All message still noStore util end call. But we need add this message into store to progess
    let hasMsgClient = false;
    if (message.isStore || message.ct === ConvoType.call) {
      if (message.ct === ConvoType.email) {
        if (message.id) {
          this.historyMessageStore.add(message);
          this.updateLastMessage(message);
        }
        return hasMsgClient;
      }
      // remove temporary message
      if (message.id) {
        hasMsgClient = this.historyMessageQuery.hasEntity(message.unixTsAndUser);
        this.historyMessageStore.remove(message.unixTsAndUser);
        this.historyMessageStore.add(message);
        this.updateLastMessage(message);
      } else {
        // add temporary message. Will replace when live message arrive
        this.historyMessageStore.add(message);
      }
    } else {
      console.log(`no store message. Dont need add to store`);
    }
    return hasMsgClient;
  }

  addMessageCustomer(message: ChatMessage) {
    this.historyMessageStore.add(message);
  }

  updateBookmarkExpandMap(data: HashMap<ChatMessage>) {
    this.historyMessageStore.update(entity => ({
      ...entity,
      bookmarkExpandMap: {
        ...entity.bookmarkExpandMap,
        ...data
      }
    }));
  }

  updateMessage(message: ChatMessage) {
    this.updateLastMessage(message);
    this.historyMessageStore.update(message.clientId, message);
  }

  removeMessage(message: ChatMessage | string) {
    if (message instanceof ChatMessage) {
      this.historyMessageStore.remove(message.clientId);
    } else {
      this.historyMessageStore.remove(message);
    }
  }

  sendWhatsApp(req: SendWhatsAppRequest) {
    if (!!req.message?.text && new Blob([req.message.text]).size > 3 * 1024) {
      this.toastService.error('message-too-large');
      return of(null);
    } else {
      return this.http.post('workspace/private/v1/chat', req);
    }
  }

  sendWhatsAppV2(req: SendWhatsAppRequest) {
    if (!!req.message?.text && new Blob([req.message.text]).size > 3 * 1024) {
      this.toastService.error('message-too-large');
      return of(null);
    } else {
      return this.http.post('workspace/private/v2/chat', req);
    }
  }

  cleanupOneConvoMessages(convoUuid: string) {
    this.historyMessageStore.remove((entity: ChatMessage) => entity.convo === convoUuid);
  }

  cleanupConvoMessages(listConvoLoaded: string[]) {
    this.historyMessageStore.remove((entity: ChatMessage) => {
      return listConvoLoaded.indexOf(entity.convo) > -1;
    });
  }

  cleanupAllMessage() {
    this.historyMessageStore.remove();
  }

  isEmptyStore() {
    return this.historyMessageStore._value().ids == null || this.historyMessageStore._value().ids.length === 0;
  }

  upsertManyMessages(messages: ChatMessage[]) {
    this.historyMessageStore.upsertMany(messages, {
      baseClass: ChatMessage
    });
  }

  private updateLastMessage(message: ChatMessage) {
    switch (message.ct) {
      case ConvoType.direct:
      case ConvoType.groupchat:
        if (message.hs) {
          this.channelHyperspaceService.updateLastMessage(message.convo, message);
        } else {
          this.channelService.updateLastMessage(message.convo, message);
        }
        break;
      case ConvoType.customer:
      case ConvoType.whatsapp:
      case ConvoType.sms:
      case ConvoType.email:
        this.convoService.updateLastMessage(message.convo, message);
        break;
      case ConvoType.personal:
        break;
      default:
        console.error(`message ${message.ct} type does not supported yet.`);
        break;
    }
  }
}

import { Injectable } from '@angular/core';
import { ContactQuery } from '@b3networks/api/contact';
import { RequestLeaveQuery } from '@b3networks/api/leave';
import {
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  HistoryMessageService,
  HyperspaceQuery,
  Integration,
  IntegrationQuery,
  Privacy,
  Privacy as PrivacyChannel,
  User,
  UserHyperspace,
  UserQuery,
  ViewUIStateCommon
} from '@b3networks/api/workspace';
import { Order } from '@datorama/akita';
import Fuse from 'fuse.js';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export type SupportedConvo = ConversationGroup | Channel | ChannelHyperspace;

const DEFAULT_THRESHOLD = 0.3;

export interface ResultSearch1<K> {
  result: Fuse.FuseResult<K>[];
  hasMore?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConvoHelperService {
  constructor(
    private channelQuery: ChannelQuery,
    private channelService: ChannelService,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private historyMessageService: HistoryMessageService,
    private userQuery: UserQuery,
    private contactQuer: ContactQuery,
    private hyperspaceQuery: HyperspaceQuery,
    private integrationQuery: IntegrationQuery,
    private requestLeaveQuery: RequestLeaveQuery
  ) {}

  // getContact(limit: number): ResultSearch1<Contact> {
  //   let result = this.contactQuer.getAll({
  //     filterBy: entity => !!entity.displayName
  //   });

  //   if (limit > 0) {
  //     const hasMore = result.length > limit;
  //     result = result.splice(0, limit);
  //     return { result, hasMore };
  //   }

  //   return { result };
  // }

  getAllUsersContainsAndMore(key: string, limit: number, optionsConfig = {}): ResultSearch1<User> {
    const list = this.userQuery.getAll({
      filterBy: user => user.memberStatus === 'ACTIVE',
      sortBy: 'displayName',
      sortByOrder: Order.ASC
    });

    let result = [];
    if (key) {
      let options = {
        keys: ['displayName', 'email', 'mobileNumber'],
        threshold: DEFAULT_THRESHOLD,
        includeScore: true
      };

      if (optionsConfig) {
        options = {
          ...options,
          ...optionsConfig
        };
      }

      const fuse = new Fuse(list, options);
      result = fuse.search(key);
    } else {
      result = list?.map(
        x =>
          <Fuse.FuseResult<User>>{
            score: 0,
            item: x,
            refIndex: 0
          }
      );
    }

    if (limit > 0) {
      const hasMore = result.length > limit;
      result = result.splice(0, limit);
      return { result, hasMore };
    }

    console.log('result: ', result);
    return { result };
  }

  getSearchableChannelsContains(key: string, limit: number, optionsConfig = {}): ResultSearch1<Channel> {
    const groups = this.channelQuery
      .getAll({
        filterBy: entity => entity.type === ChannelType.gc
      })
      ?.sort(this.sortByTs);

    let result = [];
    if (key) {
      let options = {
        keys: ['name'],
        threshold: DEFAULT_THRESHOLD,
        includeScore: true
      };

      if (optionsConfig) {
        options = {
          ...options,
          ...optionsConfig
        };
      }

      const fuse = new Fuse(groups, options);
      result = fuse.search(key);
    } else {
      result = groups?.map(
        c =>
          <Fuse.FuseResult<Channel>>{
            item: c,
            refIndex: 0,
            score: 0
          }
      );
    }

    if (limit > 0) {
      const hasMore = result.length > limit;
      result = result.splice(0, limit);
      return { result, hasMore };
    }

    return { result };
  }

  getSearchablePrivateChannelsContains(key: string, limit: number, optionsConfig = {}): ResultSearch1<Channel> {
    const publicChannel = this.channelQuery.getAll({
      filterBy: entity => entity.type === ChannelType.gc && entity.privacy === PrivacyChannel.public
    });

    let result = [];
    if (key) {
      let options = {
        keys: ['name'],
        threshold: DEFAULT_THRESHOLD,
        includeScore: true
      };

      if (optionsConfig) {
        options = {
          ...options,
          ...optionsConfig
        };
      }

      const fuse = new Fuse(publicChannel, options);
      result = fuse.search(key);
    } else {
      result = publicChannel?.map(
        c =>
          <Fuse.FuseResult<Channel>>{
            item: c,
            refIndex: 0,
            score: 0
          }
      );
    }

    if (limit > 0) {
      const hasMore = result.length > limit;
      result = result.splice(0, limit);
      return { result, hasMore };
    }

    return { result };
  }

  getSearchablePrivateChannelsHyperspaceContains(
    hyperspaceId: string,
    key: string,
    limit: number,
    optionsConfig = {}
  ): ResultSearch1<ChannelHyperspace> {
    const publicChannel = this.channelHyperspaceQuery.getAll({
      filterBy: entity =>
        entity.hyperspaceId === hyperspaceId &&
        entity.type === ChannelType.gc &&
        entity.privacy === PrivacyChannel.public
    });

    let result = [];
    if (key) {
      let options = {
        keys: ['name'],
        threshold: DEFAULT_THRESHOLD,
        includeScore: true
      };

      if (optionsConfig) {
        options = {
          ...options,
          ...optionsConfig
        };
      }

      const fuse = new Fuse(publicChannel, options);
      result = fuse.search(key);
    } else {
      result = publicChannel?.map(
        c =>
          <Fuse.FuseResult<ChannelHyperspace>>{
            item: c,
            refIndex: 0,
            score: 0
          }
      );
    }

    if (limit > 0) {
      const hasMore = result.length > limit;
      result = result.splice(0, limit);
      return { result, hasMore };
    }
    return { result };
  }

  getDirectChannels(limit: number): Channel[] {
    return this.channelQuery.getAll({
      filterBy: entity => !entity.isGroupChat && !!this.userQuery.getUserByChatUuid(entity.directChatUsers.otherUuid),
      limitTo: limit
    });
  }

  getIntegrationContains(key: string, limit: number, optionsConfig = {}): ResultSearch1<Integration> {
    const integrations = this.integrationQuery.getAll();

    let result = [];
    if (key) {
      let options = {
        keys: ['name'],
        threshold: DEFAULT_THRESHOLD,
        includeScore: true
      };

      if (optionsConfig) {
        options = {
          ...options,
          ...optionsConfig
        };
      }

      const fuse = new Fuse(integrations, options);
      result = fuse.search(key);
    } else {
      result = integrations?.map(
        c =>
          <Fuse.FuseResult<Integration>>{
            item: c,
            refIndex: 0,
            score: 0
          }
      );
    }

    if (limit > 0) {
      const hasMore = result.length > limit;
      result = result.splice(0, limit);
      return { result, hasMore };
    }

    return { result };
  }

  getChannelsContainsByQuickSearch(
    key: string,
    limit: number,
    optionsConfig = {}
  ): ResultSearch1<UnifiedSearchChannel> {
    const channel = this.channelQuery
      .getAll({
        filterBy: entity => entity.isGroupChat && !!entity.displayName
      })
      ?.map(x => this.transferUnifiedSearchChannel(x));

    const channelHyperspace = this.channelHyperspaceQuery
      .getAll({
        filterBy: entity => entity.isGroupChat && !!entity.displayName
      })
      ?.map(x => this.transferUnifiedSearchChannel(x));

    let result = [];
    if (key) {
      let options = {
        keys: ['displayName'],
        threshold: DEFAULT_THRESHOLD,
        includeScore: true
      };

      if (optionsConfig) {
        options = {
          ...options,
          ...optionsConfig
        };
      }

      const fuse = new Fuse([...channel, ...channelHyperspace], options);
      result = fuse.search(key);
    }

    if (limit > 0) {
      const hasMore = result.length > limit;
      result = result.splice(0, limit);
      return { result, hasMore };
    }

    return { result };
  }

  getChannelsHyperspaceContainsByQuickSearch(
    hyperspaceId: string,
    key: string,
    limit: number,
    optionsConfig = {}
  ): ResultSearch1<ChannelHyperspace> {
    const channel = this.channelHyperspaceQuery.getAll({
      filterBy: entity => entity.hyperspaceId === hyperspaceId && entity.isGroupChat && !!entity.displayName
    });

    let result = [];
    if (key) {
      let options = {
        keys: ['displayName'],
        threshold: DEFAULT_THRESHOLD,
        includeScore: true
      };

      if (optionsConfig) {
        options = {
          ...options,
          ...optionsConfig
        };
      }

      const fuse = new Fuse(channel, options);
      result = fuse.search(key);
    } else {
      result = channel?.map(
        c =>
          <Fuse.FuseResult<ChannelHyperspace>>{
            item: c,
            refIndex: 0,
            score: 0
          }
      );
    }

    if (limit > 0) {
      const hasMore = result.length > limit;
      result = result.splice(0, limit);
      return { result, hasMore };
    }

    return { result };
  }

  getUIState(convo: SupportedConvo) {
    if (convo instanceof Channel) {
      return this.channelQuery.getChannelUiState(convo?.id);
    } else if (convo instanceof ChannelHyperspace) {
      return this.channelHyperspaceQuery.getChannelUiState(convo?.id);
    } else {
      return this.convoGroupQuery.getConvoUiState(convo?.conversationGroupId);
    }
  }

  updateUIState(convo: SupportedConvo, newState: Partial<ViewUIStateCommon>) {
    if (convo instanceof Channel) {
      this.channelService.updateChannelViewState(convo.id, newState);
    } else if (convo instanceof ChannelHyperspace) {
      this.channelHyperspaceService.updateChannelViewState(convo.id, newState);
    } else {
      this.convoGroupService.updateConvoViewState(convo.conversationGroupId, newState);
    }
  }

  updateIsDisconnectedUIState(isDisconnect: boolean) {
    this.channelService.updateStateStore({
      isDisconnected: isDisconnect
    });

    this.channelHyperspaceService.updateStateStore({
      isDisconnected: isDisconnect
    });

    this.convoGroupService.updateStateStore({
      isDisconnected: isDisconnect
    });
  }

  removeMsgWhenReconnected() {
    // clear history
    this.historyMessageService.cleanupAllMessage();

    // reset state
    this.convoGroupService.resetChannelViewStateHistory(null);
    this.channelService.resetChannelViewStateHistory(null);
    this.channelHyperspaceQuery.resetChannelViewStateHistory(null);
  }

  getRecentChannel() {
    const channel: UnifiedSearchChannel[] = [];
    const integrations = this.integrationQuery.getAll();
    const recentChannels = this.channelQuery.getValue()?.recentChannels || [];
    const recent = [...recentChannels] || [];
    for (let i = 0; i < recent?.length; i++) {
      const item = this.channelQuery.getEntity(recent[i].id);
      if (item) {
        const activeId = this.channelQuery.getActiveId();
        if (item.id !== activeId) {
          if (item.type === ChannelType.dm) {
            const bot = integrations.find(inte => inte.msChatUuid === item.directChatUsers.otherUuid);
            if (bot) {
              channel.push(this.transferUnifiedSearchChannel(item, recent[i].date, bot));
              continue;
            }

            const user = this.userQuery.hasEntity(entity => entity?.userUuid === item.directChatUsers.otherUuid);
            if (user) {
              channel.push(this.transferUnifiedSearchChannel(item, recent[i].date));
              continue;
            }
          } else {
            channel.push(this.transferUnifiedSearchChannel(item, recent[i].date));
          }
        }
      } else {
        const itemHypers = this.channelHyperspaceQuery.getEntity(recent[i].id);
        const activeIdHyper = this.channelHyperspaceQuery.getActiveId();
        if (itemHypers && itemHypers.id !== activeIdHyper) {
          channel.push(this.transferUnifiedSearchChannel(itemHypers, recent[i].date));
        }
      }
    }
    return channel.sort((a, b) => b.lastRecentChannel - a.lastRecentChannel);
  }

  selectChannePersonal() {
    return this.channelQuery
      .selectAll({
        filterBy: entity => {
          return entity.type === ChannelType.PERSONAL;
        }
      })
      .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c))));
  }

  selectChannelByFilter() {
    const activeChannelId = this.channelQuery.getActiveId() || this.channelHyperspaceQuery.getActiveId();
    const showAll = this.channelQuery.getValue()?.showAll;
    if (showAll) {
      return combineLatest([
        this.channelQuery
          .selectAll({
            filterBy: entity => {
              const myChannel = entity.isMyChannel && !entity.archivedAt;
              return entity.type === ChannelType.gc && (myChannel || entity.id === activeChannelId);
            }
          })
          .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c)))),
        this.channelHyperspaceQuery
          .selectAll({
            filterBy: entity => {
              const myChannel = entity.isMyChannel && !entity.archivedAt;
              return entity.type === ChannelType.gc && (myChannel || entity.id === activeChannelId);
            }
          })
          .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c))))
      ]).pipe(map(([channel1, channel2]) => this.sortGCBy([...channel1, ...channel2])));
    }

    return combineLatest([
      this.channelQuery
        .selectAll({
          filterBy: entity => {
            const isDraft = !!this.channelQuery.ui.getEntity(entity.id)?.draftMsg;
            return (
              ((entity.isMyChannel && !entity.isArchived) || entity.id === activeChannelId) &&
              entity.type === ChannelType.gc &&
              (entity.unreadCount > 0 || entity.isStarred || isDraft || entity.id === activeChannelId)
            );
          }
        })
        .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c)))),
      this.channelHyperspaceQuery
        .selectAll({
          filterBy: entity => {
            const isDraft = !!this.channelHyperspaceQuery.ui.getEntity(entity.id)?.draftMsg;
            return (
              ((entity.isMyChannel && !entity.isArchived) || entity.id === activeChannelId) &&
              entity.type === ChannelType.gc &&
              (entity.unreadCount > 0 || entity.isStarred || isDraft || entity.id === activeChannelId)
            );
          }
        })
        .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c))))
    ]).pipe(map(([channel1, channel2]) => this.sortGCBy([...channel1, ...channel2])));
  }

  selectDirectChat() {
    const showAll = this.channelQuery.getValue()?.showAll;
    if (showAll) {
      return combineLatest([
        this.channelQuery
          .selectAll({
            filterBy: entity => entity.type === ChannelType.dm
          })
          .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c)))),
        this.channelHyperspaceQuery
          .selectAll({
            filterBy: entity => entity.type === ChannelType.dm
          })
          .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c))))
      ]).pipe(map(([channel1, channel2]) => [...channel1, ...channel2]));
    }

    const activeChannelId = this.channelQuery.getActiveId() || this.channelHyperspaceQuery.getActiveId();
    return combineLatest([
      this.channelQuery
        .selectAll({
          filterBy: entity => {
            const isDraft = !!this.channelQuery.ui.getEntity(entity.id)?.draftMsg;
            return (
              entity.type === ChannelType.dm &&
              (entity.unreadCount > 0 || entity.isStarred || isDraft || entity.id === activeChannelId)
            );
          }
        })
        .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c)))),
      this.channelHyperspaceQuery
        .selectAll({
          filterBy: entity => {
            const isDraft = !!this.channelHyperspaceQuery.ui.getEntity(entity.id)?.draftMsg;
            return (
              entity.type === ChannelType.dm &&
              (entity.unreadCount > 0 || entity.isStarred || isDraft || entity.id === activeChannelId)
            );
          }
        })
        .pipe(map(channels => channels.map(c => this.transferUnifiedChannel(c))))
    ]).pipe(map(([channel1, channel2]) => [...channel1, ...channel2]));
  }

  transferUnifiedSearchChannel(
    channel: Channel | ChannelHyperspace,
    lastRecentChannel?: number,
    integration?: Integration
  ) {
    return <UnifiedSearchChannel>{
      id: channel.id,
      displayName: integration ? integration.displayName : channel.name,
      hyperspaceId: channel instanceof ChannelHyperspace ? channel.hyperspaceId : null,
      privacy: channel.privacy,
      type: channel.type,
      isGroupChat: channel.isGroupChat,
      userUuidDirectChat: channel?.directChatUsers?.otherUuid,
      lastRecentChannel: lastRecentChannel,
      isBot: !!integration,
      icon: channel.icon,
      userDirectChat$:
        channel instanceof Channel && !!channel?.directChatUsers?.otherUuid
          ? !integration
            ? this.userQuery.selectUserByChatUuid(channel.directChatUsers.otherUuid).pipe(
                map(
                  u =>
                    new User({
                      ...u,
                      requestLeaveNow: this.requestLeaveQuery.getEntity(u?.identityUuid)?.requestLeaveNow
                    }) ||
                    <User>{
                      displayName: 'Unknown user'
                    }
                ),
                map(
                  u =>
                    new UserMapping(<UserMapping>{
                      isBot: false,
                      user: u
                    })
                )
              )
            : this.integrationQuery.selectAllByChatUuid(channel.directChatUsers.otherUuid).pipe(
                map(
                  u =>
                    u ||
                    <Integration>{
                      name: 'Unknown integration'
                    }
                ),
                map(
                  u =>
                    new UserMapping(<UserMapping>{
                      isBot: true,
                      integration: u
                    })
                )
              )
          : of(null),
      userHyperspaceDirectChat$:
        channel instanceof ChannelHyperspace && !!channel?.directChatUsers?.otherUuid
          ? this.hyperspaceQuery
              .selectHyperByHyperspaceId(channel.hyperspaceId)
              .pipe(map(x => x.allMembers.find(u => u.userUuid === channel.directChatUsers.otherUuid)))
          : of(null)
    };
  }

  private transferUnifiedChannel(channel: Channel | ChannelHyperspace) {
    return <UnifiedChannel>{
      id: channel.id,
      name: channel.displayName,
      hyperspaceId: channel instanceof ChannelHyperspace ? channel.hyperspaceId : null,
      privacy: channel.privacy,
      type: channel.type,
      unreadCount: channel.unreadCount,
      mentionCount: channel.mentionCount,
      isStarred: channel.isStarred,
      isMember: channel.isMember,
      userUuidDirectChat: channel?.directChatUsers?.otherUuid,
      icon: channel.icon,
      userDirectChat$:
        channel instanceof Channel && !!channel?.directChatUsers?.otherUuid
          ? this.selectUserByChatUuid(channel?.directChatUsers?.otherUuid)
          : of(null),
      userHyperspaceDirectChat$:
        channel instanceof ChannelHyperspace && !!channel?.directChatUsers?.otherUuid
          ? this.hyperspaceQuery
              .selectHyperByHyperspaceId(channel.hyperspaceId)
              .pipe(map(x => x.allMembers.find(u => u.userUuid === channel.directChatUsers.otherUuid)))
          : of(null),
      isDraft$:
        channel instanceof Channel
          ? this.channelQuery.selectUIState(channel.id, 'draftMsg').pipe(
              map(d => !!d),
              distinctUntilChanged()
            )
          : this.channelHyperspaceQuery.selectUIState(channel.id, 'draftMsg').pipe(
              map(d => !!d),
              distinctUntilChanged()
            )
    };
  }

  private selectUserByChatUuid(userUuid: string) {
    const integration = this.integrationQuery.getBotByChatUuid(userUuid);
    return integration
      ? of(integration)
      : this.userQuery.selectUserByChatUuid(userUuid).pipe(
          map(
            u =>
              new User({ ...u, requestLeaveNow: this.requestLeaveQuery.getEntity(u?.identityUuid)?.requestLeaveNow }) ||
              <User>{
                displayName: 'Unknown user'
              }
          )
        );
  }

  private sortByTs(a: SupportedConvo, b: SupportedConvo) {
    const ats =
      a instanceof ConversationGroup ? a.lastMsg?.ts : a instanceof Channel ? a.lastMessage?.ts : a?.lastSeenMillis;
    const bts =
      b instanceof ConversationGroup ? b.lastMsg?.ts : b instanceof Channel ? b.lastMessage?.ts : b?.lastSeenMillis;
    return new Date(bts)?.getTime() - new Date(ats)?.getTime();
  }

  private sortGCBy(channel: UnifiedChannel[]) {
    return channel.sort((a, b) => a?.name?.localeCompare(b?.name));
  }
}

export interface UnifiedChannel {
  id: string;
  name: string;
  hyperspaceId: string;
  privacy: Privacy;
  type: ChannelType;
  unreadCount: number;
  mentionCount: number;
  isStarred: boolean;
  isMember: boolean;
  userUuidDirectChat: string;
  icon: string;

  // observable
  isDraft$: Observable<boolean>;
  userHyperspaceDirectChat$: Observable<UserHyperspace>;
  userDirectChat$: Observable<User>;
}

export interface UnifiedSearchChannel {
  id: string;
  displayName: string;
  hyperspaceId: string;
  privacy: Privacy;
  type: ChannelType;
  lastRecentChannel: number;
  isGroupChat: boolean;
  userUuidDirectChat: string;
  userHyperspaceDirectChat$: Observable<UserHyperspace>;
  userDirectChat$: Observable<UserMapping>;
  isBot: boolean;
  icon: string;
}

export class UserMapping {
  user: User;
  integration: Integration;
  isBot: boolean;

  constructor(obj: UserMapping) {
    Object.assign(this, obj);
  }
}

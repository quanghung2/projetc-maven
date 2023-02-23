import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApprovalWorkspaceService } from '@b3networks/api/approval';
import { Contact, ContactQuery, ContactService } from '@b3networks/api/contact';
import {
  AttachmentMessageData,
  Channel,
  ChannelHyperspace,
  ChannelHyperspaceQuery,
  ChannelHyperspaceService,
  ChannelQuery,
  ChannelService,
  ChannelType,
  ChatChannelHyperspaceStoreName,
  ChatChannelStoreName,
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupQuery,
  ConversationGroupService,
  ConversationMetadata,
  ConversationType,
  ConvoGroupStoreName,
  ConvoType,
  CustomerInfo,
  FileDetail,
  GroupType,
  HistoryMessageService,
  HyperspaceQuery,
  HyperspaceService,
  Integration,
  IntegrationQuery,
  IntegrationService,
  IParticipant,
  JoinLeaveFollowedData,
  MappingHyperData,
  MediaService,
  Member,
  MeQuery,
  MoveEmailConversation,
  MsgType,
  Privacy,
  RoleType,
  SnoozeEmailConversation,
  Status,
  SystemMessageData,
  SystemMsgType,
  SystemType,
  TimeService,
  TxnMessageData,
  TypingState,
  UpdateChannelMetaData,
  User,
  UserQuery,
  UserService,
  UserStatus,
  UserStatusResponse,
  UserType,
  ViewUIStateCommon,
  WindownActiveService
} from '@b3networks/api/workspace';
import { randomGuid, X } from '@b3networks/shared/common';
import { BrowserNotificationService, NotificationRouterLink } from '@b3networks/shared/notification';
import { ToastService } from '@b3networks/shared/ui/toast';
import { EntityStoreAction, runEntityStoreAction } from '@datorama/akita';
import * as _ from 'lodash';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, filter, mergeMap, share, take } from 'rxjs/operators';
import { ConvoHelperService, SupportedConvo } from '../adapter/convo-helper.service';
import { APPROVAL_BOT_NAME } from '../constant/common.const';
import { MessageConstants } from '../constant/message.const';
import { RegExpPattern } from '../constant/patterns.const';
import { Match, MatchType } from '../model/match.model';
import { Txn } from './txn/txn.model';
import { TxnQuery } from './txn/txn.query';
import { TxnService } from './txn/txn.service';

const SUPPORTED_CONVOS = [ConvoType.whatsapp, ConvoType.customer, ConvoType.email];
const SUPPORTED_CHANNEL = [ConvoType.direct, ConvoType.groupchat, ConvoType.personal];

@Injectable({ providedIn: 'root' })
export class MessageReceiveProcessor {
  notNotification: boolean;

  private _message$: Subject<ChatMessage> = new Subject();

  constructor(
    private meQuery: MeQuery,
    private chatService: ChatService,
    private messageService: HistoryMessageService,
    private browserNotification: BrowserNotificationService,
    private timeService: TimeService,
    private toastService: ToastService,
    private router: Router,
    private contactQuery: ContactQuery,
    private contactService: ContactService,
    private windownActiveService: WindownActiveService,
    private txnQuery: TxnQuery,
    private txnService: TxnService,
    private userQuery: UserQuery,
    private userService: UserService,
    private integrationQuery: IntegrationQuery,
    private channelHyperspaceQuery: ChannelHyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService,
    private convoGroupQuery: ConversationGroupQuery,
    private convoGroupService: ConversationGroupService,
    private channelService: ChannelService,
    private channelQuery: ChannelQuery,
    private convoHelper: ConvoHelperService,
    private hyperspaceQuery: HyperspaceQuery,
    private hyperspaceService: HyperspaceService,
    private approvalWorkspaceService: ApprovalWorkspaceService,
    private integrationService: IntegrationService,
    private mediaService: MediaService
  ) {}

  pushEventMessage(message: ChatMessage) {
    this._message$.next(message);
  }

  onmessage(): Observable<ChatMessage> {
    return this._message$.asObservable().pipe(share());
  }

  process(message: ChatMessage) {
    if (message.err) {
      this.toastService.error(message.err);
      return;
    }

    if (message.mt === MsgType.case) {
      return;
    }

    if ([...SUPPORTED_CHANNEL, ...SUPPORTED_CONVOS].indexOf(message.ct) === -1 && message.st !== SystemType.STATUS) {
      if (message.mt === MsgType.system) {
        if (message.hs) {
          // system hyperspace management
          this.handleSystemMessageHyperspace(message);
        } else {
          this.handleSystemNewUser(message);
        }
      }
      return;
    }

    const me = this.meQuery.getMe();
    // for temp message
    if (message.id == null && message.user === me?.userUuid && message.isStore) {
      //add 2 store
      if (!(message.ct === ConvoType.email && message?.body?.data?.type === SystemMsgType.followed)) {
        this.messageService.addMessage(message);
      }
    } else {
      if (message.st) {
        this.handleSystemMessage(message);
      } else {
        switch (message.ct) {
          case ConvoType.direct:
          case ConvoType.groupchat:
            if (message.hs) {
              const hyper = this.hyperspaceQuery.getHyperByHyperspaceId(message.hs);
              if (!hyper) {
                this.hyperspaceService.getHyperspacesByMember(X.orgUuid).subscribe();
              }

              const channel = this.channelHyperspaceQuery.getChannel(message.convo);
              if (channel) {
                this.processMsg(channel, message);
              } else {
                this.channelHyperspaceService
                  .getDetails(message.hs, message.convo, <MappingHyperData>{
                    meUuid: me.userUuid,
                    currentOrg: X.orgUuid
                  })
                  .subscribe(c => {
                    if (message.isStore && message.isCountUnread && message.user !== me.userUuid) {
                      this._updateConvo(c, <any>{
                        unreadCount: 1
                      });
                    }
                  });
              }
            } else {
              const channel = this.channelQuery.getChannel(message.convo);
              if (channel) {
                this.processMsg(channel, message);
              } else {
                let api$ = of<(User | Integration)[]>([]);
                if (message.ct === ConvoType.direct) {
                  const chatUserUuid = message.user;
                  const user = this.userQuery.getUserByChatUuid(chatUserUuid);
                  const integration = this.integrationQuery.getBotByChatUuid(chatUserUuid);
                  if (!user && !integration) {
                    api$ = this.userService
                      .findByUuidAndUserType([chatUserUuid], 'chatId')
                      .pipe(catchError(() => of([])));
                  }
                }

                forkJoin([this.channelService.getDetails(message.convo, me.userUuid), api$]).subscribe(
                  ([c, user]: [Channel, any]) => {
                    if (message.isStore && message.isCountUnread && message.user !== me.userUuid) {
                      this._updateConvo(c, <any>{ unreadCount: 1 });
                      this.convoHelper.updateUIState(c, <ViewUIStateCommon>{
                        newMessage: message
                      });
                    }

                    const approvalBot = user.find(u => u.isBot && u.name === APPROVAL_BOT_NAME);
                    if (approvalBot) {
                      this.approvalWorkspaceService.checkBot((approvalBot as Integration).msChatUuid).subscribe(res => {
                        if (res.isApprovalBot) {
                          this.integrationService.updateStateStore({
                            approvalBot: (approvalBot as Integration).msChatUuid
                          });
                        }
                      });
                    }
                  }
                );
              }
            }
            break;
          case ConvoType.personal: {
            const channel1 = this.channelQuery.getPersonalChannel(message.convo);
            if (channel1) {
              this.processMsg(channel1, message);
            } else {
              this.channelQuery
                .selectEntity(message.convo)
                .pipe(
                  filter(x => x != null),
                  take(1)
                )
                .subscribe(c => this.processMsg(c, message));
            }
            break;
          }
          case ConvoType.customer: {
            const convo = this.addConversation2Store(message);
            if (convo) {
              this.processMsg(convo, message);
            } else {
              console.error('Not found convo', message);
            }
            break;
          }
          case ConvoType.whatsapp:
          case ConvoType.sms: {
            const convo = this.convoGroupQuery.getConvo(message.convo);
            this.processMsg(convo, message);
            break;
          }
          case ConvoType.email: {
            const emailConvos = this.convoGroupQuery.getConvosByChildId(message.convo);
            if (emailConvos && emailConvos.length) {
              this.processMsg(emailConvos[0], message);
            } else {
              this.convoGroupService.getConversationDetail(message.convo, me.userUuid, true).subscribe();
            }
            break;
          }
          default:
            console.error(`message ${message.ct} type does not supported yet.`);
            break;
        }
      }
    }

    // share message
    this.pushEventMessage(message);
  }

  showNotification(message: ChatMessage, convo: SupportedConvo) {
    const me = this.meQuery.getMe();
    const id = convo instanceof ConversationGroup ? convo?.conversationGroupId : convo?.id;
    if (message.user === me.userUuid || (window.location.href.indexOf(id) >= 0 && !document.hidden)) {
      return;
    }

    this.showCustomerNotification(message, convo);
  }

  private processMsg(convo: SupportedConvo, message: ChatMessage) {
    this.cacheMediaForChannel(message);

    // convo can be null
    const me = this.meQuery.getMe();
    // add to store for loaded convo
    const uiState = this.convoHelper.getUIState(convo);
    if (uiState?.loaded || uiState?.needReceiveLiveMessage) {
      let isMsgFromClient: boolean;
      if (message.isStore) {
        isMsgFromClient = this.messageService.addMessage(message);
      }
      if (isMsgFromClient && convo && !message.body.data && me.userUuid === message.user) {
        const urlMatched = message.body.text?.match(RegExpPattern.URL);
        if (urlMatched) {
          this.convoGroupService.getPreviewLink(urlMatched[0]).subscribe(res => {
            if (res && (res.desc || res.icon || res.image || res.title)) {
              const msg = new ChatMessage(
                Object.assign(
                  {},
                  {
                    ...message,
                    body: {
                      ...message?.body,
                      data: res
                    }
                  }
                )
              );
              msg.st = SystemType.EDIT;
              this.chatService.send(msg);
            }
          });
        }
      }
    }

    if (message.isStore) {
      // hasMention send from ms-chat for each user.
      if (message.IsNotified) {
        this.showCustomerNotification(message, convo);
        // increase mention count
        this._updateConvo(convo, <any>{
          mentionCount: (convo?.mentionCount || 0) + 1
        });
      } else {
        if (message.ct === ConvoType.whatsapp || message.ct === ConvoType.customer) {
          this.showCustomerNotification(message, convo);
        }
      }

      if (message.user !== me.userUuid) {
        if (message.isCountUnread) {
          const updateChannel = <Channel>{
            unreadCount: (convo?.unreadCount || 0) + 1
          };

          // update last msg
          if (updateChannel.unreadCount === 1 && SUPPORTED_CHANNEL.includes(message.ct)) {
            this.convoHelper.updateUIState(convo, <ViewUIStateCommon>{
              newMessage: message
            });
          }
          this._updateConvo(convo, updateChannel);
        }

        if (message.ct === ConvoType.whatsapp || message.ct === ConvoType.customer) {
          this.txnService.countUnread(message.convo);
        }
      }
    }

    if (message.mt !== MsgType.system) {
      // live update for whatsapp last received date from customer
      // to open editor again
      if (message.ut === UserType.Customer && message.ct === ConvoType.whatsapp) {
        this._updateConvo(convo, <ConversationGroup>{
          whatsappLastReceivedDate: new Date(message.ts)
        });
      }
    } else if (message.mt === MsgType.system) {
      this.handleCustomSystemMessage(convo, message);
    }
  }

  private cacheMediaForChannel(message: ChatMessage) {
    if (!!message?.id && message.mt === MsgType.attachment) {
      const data: AttachmentMessageData = message.body.data?.attachment || message.body.data;
      const uri =
        data?.uri?.startsWith('storage://') || data?.uri?.startsWith('legacy://')
          ? data?.uri
          : data.mediaUuid || data.mediaId || data.fileUuid;
      if (uri) {
        const detail = <FileDetail>{
          convoId: message.convo,
          userId: message.user,
          name: data.name,
          uri: uri,
          fileType: data.fileType,
          size: data.size,
          metadata: {
            width: data.width,
            height: data.height
          },
          mediaId: data.mediaId || data.mediaUuid || data.fileUuid,
          createdTime: message.ts,
          msgId: message.id
        };
        this.mediaService.addMedias2Store([detail]);
      }
    }
  }

  private handleSystemNewUser(message: ChatMessage) {
    if (
      (<SystemMessageData>message.body?.data)?.type === SystemMsgType.newUser &&
      !!(<SystemMessageData>message.body?.data)?.newUser
    ) {
      const newUser = (<SystemMessageData>message.body.data).newUser;
      const user = new User(<User>{
        uuid: newUser.memberUuid,
        userUuid: newUser.chatUserId,
        displayName: newUser.displayName,
        role: newUser.role,
        orgUuid: newUser.orgUuid,
        status: UserStatus.offline,
        identityUuid: newUser.memberUuid,
        memberStatus: newUser.memberStatus
      });
      this.userService.updateUsers2Store([user]);
    }
  }

  private handleSystemMessageHyperspace(message: ChatMessage) {
    const hyper = this.hyperspaceQuery.getHyperByHyperspaceId(message.hs);
    if (message.body?.data?.type === SystemMsgType.hyperspaceUpdateUsers || !hyper) {
      this.hyperspaceService.getHyperspacesByMember(X.orgUuid).subscribe();
    }

    // new channel hyper
    if (message.convo) {
      const infoChannel = message.body?.data;
      const channelHyper = this.channelHyperspaceQuery.getEntity(message.convo);
      if (!channelHyper) {
        const channel = new ChannelHyperspace({
          hyperspaceId: message.hs,
          id: message.convo,
          name: infoChannel?.name,
          privacy: infoChannel?.privacy,
          type: infoChannel?.type
        }).mappingModel(<MappingHyperData>{
          meUuid: this.meQuery.getMe().userUuid,
          currentOrg: X.orgUuid
        });
        this.channelHyperspaceService.updateChannel([channel]);
      }
    }
  }

  private handleSystemMessage(message: ChatMessage) {
    switch (message.st) {
      case SystemType.SEEN:
        const me = this.meQuery.getMe();
        if (me && message.user === me.userUuid) {
          if (SUPPORTED_CHANNEL.indexOf(message.ct) > -1) {
            if (message.hs) {
              this.channelHyperspaceService.markSeen(message.convo);
            } else {
              this.channelService.markSeen(message.convo, message.ts);
            }
          } else {
            if (message.ct === ConvoType.whatsapp || message.ct === ConvoType.customer) {
              this.txnService.markSeen(message.convo);
            } else if (message.ct === ConvoType.email) {
              const emailConvos = this.convoGroupQuery.getConvosByChildId(message.convo);
              if (emailConvos && emailConvos.length) {
                this.convoGroupService.markSeen(emailConvos[0].id);
              }
            } else {
              this.convoGroupService.markSeen(message.convo);
            }
          }
        }
        break;
      case SystemType.EDIT:
        if (message.ct === ConvoType.personal && message?.messageBookmark) {
          this.messageService.updateBookmarkExpandMap({
            [message.messageBookmark.id]: null
          });
        }
        this.messageService.updateMessage(message);
        break;
      case SystemType.DELETE:
        this.messageService.updateMessage(message);
        if (message.mt === MsgType.attachment) {
          this.mediaService.removeMedias2StoreByMsgId(message.id);
        }
        break;
      case SystemType.PURGE:
        this.messageService.removeMessage(message);
        break;
      // only public channel
      case SystemType.CHANNEL_NEW:
      case SystemType.CHANNEL_UPDATE:
        const metadata = (<UpdateChannelMetaData>(<Partial<SystemMessageData>>message.body).data).metadata;
        if (message.isFromChannel && !!metadata) {
          const channel = <Channel>{
            ...metadata,
            privacy: Privacy.public,
            type: ChannelType.gc
          };
          this.channelService.updateChannel([channel]);
        }
        break;
      case SystemType.STATUS:
        const status = message.mt === MsgType.online ? UserStatus.online : UserStatus.offline;
        const userStatus = new UserStatusResponse({ uuid: message.user, state: status, ts: message.ts });
        this.userService.updateUserStatus([userStatus]);
        break;
      default:
        console.error(`new system status and no catched`);
        break;
    }
  }

  private handleCustomSystemMessage(convo: SupportedConvo, message: ChatMessage) {
    if (!message.body.data) {
      console.error(`custom message without data`);
      return;
    }

    const me = this.meQuery.getMe();

    // public channel has name & id fields only => get detail channel
    // channel is public to search only => participants nerver correct
    if (SUPPORTED_CHANNEL.indexOf(message.ct) > -1) {
      if (message.body.data.type === SystemMsgType.join && !message.hs) {
        const hasMe = message.body.data?.join?.indexOf(me.userUuid) > -1;
        if (hasMe) {
          // fetch detail convo
          this.channelService.getDetails(message.convo, me.userUuid).subscribe(__ => {
            if (message.isStore && message.isCountUnread && message.user !== me.userUuid) {
              this._updateConvo(convo, <Channel>{ unreadCount: 1 });
              this.convoHelper.updateUIState(convo, <ViewUIStateCommon>{
                newMessage: message
              });
            }
          });
          return;
        }
      } else if (message.body.data.type === SystemMsgType.convoUpdateUsers && message.hs) {
        const data1 = <SystemMessageData>message?.body?.data;
        const hasMe = (<Partial<JoinLeaveFollowedData>>data1?.convoUpdateUsers)?.joined?.some(
          p => p.id === me.userUuid
        );
        if (hasMe) {
          this.channelHyperspaceService
            .getDetails(message.hs, message.convo, <MappingHyperData>{
              meUuid: me.userUuid,
              currentOrg: X.orgUuid
            })
            .subscribe(__ => {
              if (message.isStore && message.isCountUnread && message.user !== me.userUuid) {
                this._updateConvo(convo, <ChannelHyperspace>{
                  unreadCount: 1
                });
              }
            });
        }
      }
    }
    this.messageTypeSystem(convo, message);
  }

  private messageTypeSystem(convo: SupportedConvo, message: ChatMessage) {
    const me = this.meQuery.getMe();

    if (message.body.data.type === SystemMsgType.leave) {
      const hasMe = message.body.data?.leave?.indexOf(me.userUuid) > -1;
      if (hasMe) {
        const id = convo instanceof ConversationGroup ? convo?.conversationGroupId : convo?.id;

        // switch convo
        const activeConvo = this.getActiveByChannel(convo);
        if (activeConvo === id) {
          const general = this.channelQuery.getGeneral();
          if (general && general.length > 0) {
            this.router.navigate(['conversations', general[0].id]);
          }
          // remove convo
          if (convo instanceof Channel) {
            this.channelService.closeConversation(id);
          } else if (convo instanceof ChannelHyperspace) {
            this.channelHyperspaceService.closeConversation(id);
          } else if (convo instanceof ConversationGroup) {
            this.convoGroupService.closeConversation(id);
          }
        }
      }
    }

    const isConvoGroup = convo instanceof ConversationGroup;

    // post_process message receive for system message
    // process join, leave, follow, typing msg
    switch (message.body.data.type) {
      case SystemMsgType.typing:
        this.updateTyping(convo, message);
        break;
      case SystemMsgType.update: {
        const data = <SystemMessageData>message?.body?.data;
        const metadata = (<Partial<UpdateChannelMetaData>>data)?.metadata;
        this._updateConvo(convo, <Channel>metadata);
        break;
      }
      case SystemMsgType.convoUpdateUsers:
        if (message.hs && [ConvoType.groupchat].indexOf(message.ct) > -1 && me) {
          const data1 = <SystemMessageData>message?.body?.data;
          if (data1.convoUpdateUsers) {
            if (data1?.convoUpdateUsers?.joined) {
              const joins = (<Partial<JoinLeaveFollowedData>>data1?.convoUpdateUsers)?.joined;
              const participantCurrentOrg: IParticipant[] = [
                ...((convo as ChannelHyperspace)?.participantCurrentOrg || [])
              ];
              const participantOtherOrg: IParticipant[] = [
                ...((convo as ChannelHyperspace)?.participantOtherOrg || [])
              ];

              joins.forEach(item => {
                if (item.ns === X.orgUuid) {
                  if (!participantCurrentOrg.some(x => x.userID === item.id)) {
                    participantCurrentOrg.push(<IParticipant>{
                      userID: item.id,
                      role: item.role
                    });
                  }
                } else {
                  if (!participantCurrentOrg.some(x => x.userID === item.id)) {
                    participantOtherOrg.push(<IParticipant>{
                      userID: item.id,
                      role: item.role
                    });
                  }
                }
              });

              this._updateConvo(convo, <ChannelHyperspace>{
                participantCurrentOrg,
                participantOtherOrg
              });
            } else if (data1?.convoUpdateUsers?.left) {
              const left = (<Partial<JoinLeaveFollowedData>>data1?.convoUpdateUsers)?.left;
              const participantCurrentOrg: IParticipant[] = [
                ...((convo as ChannelHyperspace)?.participantCurrentOrg || [])
              ].filter(x => !left.some(l => l.id === x.userID));
              const participantOtherOrg: IParticipant[] = [
                ...((convo as ChannelHyperspace)?.participantOtherOrg || [])
              ].filter(x => !left.some(l => l.id === x.userID));

              this._updateConvo(convo, <ChannelHyperspace>{
                participantCurrentOrg,
                participantOtherOrg
              });
            }
          }
        }
        break;

      case SystemMsgType.join:
        if ([ConvoType.groupchat].indexOf(message.ct) > -1 && me) {
          const data1 = <SystemMessageData>message?.body?.data;

          // update participant for channel
          const participants = [...((convo as Channel)?.participants || [])];
          const joins = (<Partial<JoinLeaveFollowedData>>data1)?.join || [];
          joins.forEach(u => {
            if (!participants.some(x => x.userID === u)) {
              participants.push(<IParticipant>{
                userID: u,
                role: ''
              });
            }
          });
          this._updateConvo(convo, <Channel>{ participants: participants });
        }

        if (message.ct === ConvoType.email) {
          const conversationGroup = convo as ConversationGroup;
          const data2: SystemMessageData = <SystemMessageData>message?.body?.data;
          const joins: string[] = data2.data.join || [];
          const origin = <Member[]>conversationGroup.conversations[0].members || [];
          const members = [...origin];

          joins.forEach(u => {
            const findIndex = origin.findIndex(x => x.chatUserUuid === u && x.role === RoleType.followed);
            if (findIndex > -1) {
              members.splice(findIndex, 1);
            }
            members.push(<Member>{
              chatUserUuid: u,
              role: RoleType.member
            });
          });

          const firstConvoChild = new ConversationMetadata({
            ...conversationGroup.conversations[0],
            members: members
          });

          this._updateConvo(convo, <ConversationGroup>{
            conversations: [firstConvoChild]
          });
        }
        break;

      case SystemMsgType.followed:
        if (message.ct === ConvoType.email) {
          const conversationGroup = convo as ConversationGroup;
          const data2: SystemMessageData = <SystemMessageData>message?.body?.data;
          const follows: string[] = data2.data.followed || [];
          const origin = <Member[]>conversationGroup.conversations[0].members || [];
          const members = [...origin];
          let isUpdated = false;

          follows.forEach(u => {
            const findIndex = origin.findIndex(x => x.chatUserUuid === u && x.role === RoleType.member);
            if (findIndex > -1) {
              members.splice(findIndex, 1);
            }
            if (origin.findIndex(x => x.chatUserUuid === u && x.role === RoleType.followed) === -1) {
              isUpdated = true;
              members.push(<Member>{
                chatUserUuid: u,
                role: RoleType.followed
              });
            }
          });

          if (isUpdated) {
            const firstConvoChild = new ConversationMetadata({
              ...conversationGroup.conversations[0],
              members: members
            });

            this._updateConvo(convo, <ConversationGroup>{
              conversations: [firstConvoChild]
            });
          }
        }
        break;

      case SystemMsgType.leave:
        if (message.ct === ConvoType.groupchat && me) {
          const data2 = <SystemMessageData>message?.body?.data;

          // update participant for channel
          let participants = (convo as Channel)?.participants || [];
          const leaves = ((<Partial<JoinLeaveFollowedData>>data2)?.leave as string[]) || [];
          participants = participants.filter(p => leaves.indexOf(p.userID) === -1);
          this._updateConvo(convo, <Channel>{ participants: participants });
        }

        if (message.ct === ConvoType.email) {
          const conversationGroup = convo as ConversationGroup;
          let participants = conversationGroup?.members || [];
          const data2: SystemMessageData = <SystemMessageData>message?.body?.data;
          const leaves = data2.data.leave || [];
          participants = participants.filter(p => leaves.indexOf(p.chatUserUuid) === -1);
          const firstConvoChild = new ConversationMetadata({
            ...conversationGroup.conversations[0],
            members: participants
          });

          this._updateConvo(convo, <ConversationGroup>{
            conversations: [firstConvoChild]
          });
        }
        break;

      case SystemMsgType.archived: {
        if (message.ct === ConvoType.customer) {
          const data = message.body?.data as TxnMessageData;
          this.checkAndStoreTxnContact(data, message, true);

          if (data?.txnUuid) {
            const customerConvo = this.convoGroupQuery.getEntity(data?.txnUuid);
            if (customerConvo) {
              this._updateConvo(customerConvo, <ConversationGroup>{
                status: Status.archived,
                archivedBy: message.user
              });
            }
          }
        }

        const req = isConvoGroup
          ? <ConversationGroup>{
              status: Status.archived,
              archivedBy: message.user
            }
          : <Channel>{ archivedAt: new Date(message.ts), archivedBy: message.user };
        this._updateConvo(convo, req);
        break;
      }

      case SystemMsgType.unarchived: {
        const req1 = isConvoGroup
          ? <ConversationGroup>{
              status: Status.opened,
              archivedBy: null
            }
          : <Channel>{ archivedAt: null, archivedBy: null };
        this._updateConvo(convo, req1);
        break;
      }

      case SystemMsgType.move:
        if (message.ct === ConvoType.email) {
          const body = <SystemMessageData>message.body.data;
          const bodyData: MoveEmailConversation = body?.data;
          this._updateConvo(convo, <ConversationGroup>{
            emailInboxUuid: bodyData.emailInboxUuid
          });
        }
        break;
      case SystemMsgType.snooze:
        if (message.ct === ConvoType.email) {
          const body = <SystemMessageData>message.body.data;
          const bodyData: SnoozeEmailConversation = body?.data;
          this._updateConvo(convo, <ConversationGroup>{
            snoozeFrom: bodyData.snoozeFrom,
            snoozeAt: bodyData.snoozeAt,
            snoozeBy: me.identityUuid
          });
        }
        break;
      case SystemMsgType.convoUpdateMetadata:
        const convoUpdateMetadata = (<SystemMessageData>message.body.data)?.convoUpdateMetadata;
        if (message.hs && convoUpdateMetadata) {
          const desc = convoUpdateMetadata?.description;
          this._updateConvo(convo, <ChannelHyperspace>{ description: desc });
        }
        break;

      // inbox system flow
      case SystemMsgType.created: {
        const data = message.body?.data as TxnMessageData;
        this.checkAndStoreTxnContact(data, message);
        break;
      }
      case SystemMsgType.assigned: {
        const data = message.body?.data as TxnMessageData;
        this.checkAndStoreTxnContact(data, message);
        if (data?.txnUuid) {
          const txn = this.txnQuery.getEntity(data?.txnUuid);
          const participant = [...(txn.lastAssignedAgents || [])];
          const join = data?.assignees || [];
          join.forEach(u => {
            if (!participant.includes(u)) {
              participant.push(u);
            }
          });
          this.txnService.updateTxn2Store(data.txnUuid, {
            lastAssignedAgents: participant
          });
        }

        break;
      }
      case SystemMsgType.unassigned: {
        const data = message.body?.data as TxnMessageData;
        this.checkAndStoreTxnContact(data, message);

        if (data?.txnUuid) {
          const txn = this.txnQuery.getEntity(data.txnUuid);
          let participant = [...(txn.lastAssignedAgents || [])];
          const left = data.assignees || [];
          participant = participant.filter(p => left.includes(p));
          this.txnService.updateTxn2Store(data.txnUuid, {
            lastAssignedAgents: participant
          });
        }

        break;
      }
      case SystemMsgType.updateData: {
        const data = message.body?.data as TxnMessageData;
        this.checkAndStoreTxnContact(data, message);
        break;
      }
      default:
        console.error(`customized system message unhandled: ${message.body.data.type}`);
        break;
    }
  }

  private checkAndStoreTxnContact(data: TxnMessageData, message: ChatMessage, isClosed?: boolean) {
    if (data?.txnUuid) {
      let txn = this.txnQuery.getEntity(data.txnUuid);
      txn = new Txn({
        ...txn,
        txnUuid: data?.txnUuid || undefined,
        inboxUuid: data.inboxUuid || undefined,
        publicConvoId: data?.publicConvoId || undefined,
        teamConvoId: message.convo,
        customerUuid: data?.customer?.uuid || undefined,
        customerName: data?.customer?.displayName || undefined,
        createdAt: new Date().getTime(),
        channel: data.channel || undefined,
        closed: isClosed,
        typeId: data.txnTypeId || undefined,
        severityId: data?.txnSeverityId || undefined,
        productIds: data?.productIds || undefined,
        isTemporary: true
      });
      this.txnService.updateTxns2Store([txn]);

      if (data?.customer?.uuid) {
        let contact = this.contactQuery.getEntity(data?.customer?.uuid);
        if (!contact) {
          contact = new Contact({
            uuid: data.customer?.uuid,
            displayName: data.customer?.displayName,
            chatCustomerId: data?.customer?.chatUserId,
            isTemporary: false
          });
        }
        this.contactService.updateContacts2Store([contact]);
      }
    }
  }

  private showCustomerNotification(message: ChatMessage, convo: SupportedConvo) {
    // convo can be null
    if (message.mt === MsgType.system) {
      return;
    }

    if (this.meQuery.getMe()?.userUuid === message.user) {
      return;
    }

    if (this.windownActiveService.windowActiveStatus) {
      const activeId = this.getActiveByChannel(convo);
      if (activeId) {
        const id = convo instanceof ConversationGroup ? convo?.conversationGroupId : convo?.id;
        if (activeId === id) {
          return;
        }
      }
    }

    let content = '';
    if ([MsgType.attachment, MsgType.prechatsurvey].indexOf(message.mt) > -1) {
      content = message.body.data.name;
    } else {
      content = this.getMessageNotificationContent(message);
    }

    if ((message.ct === ConvoType.whatsapp || message.ct === ConvoType.customer) && message.ut === UserType.Customer) {
      const contact = this.contactQuery.getContactByChatCustomerId(message.user);
      this.fireNotify(message, convo, contact?.displayName, content);
    } else {
      of(this.userQuery.getUserByChatUuid(message.user))
        .pipe(
          mergeMap(users =>
            users != null ? of([users]) : this.userService.findByUuidAndUserType([message.user], 'chatId')
          )
        )
        .subscribe(users => {
          let userName = 'New customer';
          if (users[0]) {
            userName = users[0].displayName;
          } else {
            if (convo && convo instanceof ConversationGroup) {
              userName = convo?.customerInfo?.name || convo?.customerInfo?.email;
            }
          }

          this.fireNotify(message, convo, userName, content);
        });
    }
  }

  private fireNotify(
    message: ChatMessage,
    convo: SupportedConvo,
    displayName: string,
    content: string,
    photoUrl?: string,
    imgName?: string
  ) {
    let title = 'New message';
    let contentFinnal = content;
    let findContact: Contact;

    if (SUPPORTED_CHANNEL.indexOf(message.ct) > -1) {
      if (message.mt === MsgType.attachment) {
        title = MessageConstants.NOTIFY_NEW_ATTACHMENT(displayName);
      } else if (message.mt === MsgType.email) {
        title = MessageConstants.NOTIFY_NEW_EMAIL(displayName);
      } else {
        if ((convo as Channel).isGroupChat) {
          title = MessageConstants.NOTIFY_NEW_MSG_IN_CHANNEL(convo?.displayName);
          contentFinnal = `${displayName}: ${content}`;
        } else {
          title = MessageConstants.NOTIFY_NEW_MSG(displayName);
        }
      }
    } else if ([ConvoType.whatsapp, ConvoType.customer].indexOf(message.ct) > -1) {
      const txn = this.txnQuery.getEntity(message.convo);
      const me = this.meQuery.getMe();
      if (!txn?.lastAssignedAgents || txn.lastAssignedAgents.indexOf(me?.identityUuid) === -1) {
        return;
      }

      if (message.mt === MsgType.attachment) {
        title = MessageConstants.NOTIFY_NEW_ATTACHMENT(displayName);
      } else {
        if (displayName) {
          contentFinnal = `${displayName}: ${content}`;
        }

        if (message.ut === UserType.Customer) {
          title = MessageConstants.NOTIFY_NEW_MSG_IN_CONTACT(displayName);
        } else {
          // agent
          title = MessageConstants.NOTIFY_NEW_MSG_AGENT_IN_CONTACT(displayName);

          findContact = this.contactQuery.getEntity(txn.customerUuid);
          if (findContact) {
            title = MessageConstants.NOTIFY_NEW_MSG_IN_CONTACT(findContact.displayName);
          }
        }
      }
    } else if (ConvoType.email === message.ct) {
      return;
    }

    const routerLink = <NotificationRouterLink>{
      commands: []
    };
    if (SUPPORTED_CHANNEL.indexOf(message.ct) > -1) {
      routerLink.commands = ['conversations', convo?.id];
    } else if (message.ct === ConvoType.whatsapp || message.ct === ConvoType.customer) {
      if (message.ut === UserType.Customer) {
        const contact = this.contactQuery.getContactByChatCustomerId(message.user);
        if (contact) {
          const txn = this.txnQuery.getEntity(message.convo);
          if (txn?.txnUuid && txn?.inboxUuid) {
            routerLink.commands = ['contacts', contact.uuid, 'txns', 'inboxes', txn.inboxUuid];
          } else {
            routerLink.commands = ['contacts', contact.uuid, 'txns', 'active'];
          }
        }
      } else if (message.ut === UserType.Agent && findContact) {
        const txn = this.txnQuery.getEntity(message.convo);
        if (txn?.txnUuid && txn?.inboxUuid) {
          routerLink.commands = ['contacts', findContact.uuid, 'txns', 'inboxes', txn.inboxUuid];
        } else {
          routerLink.commands = ['contacts', findContact.uuid, 'txns', 'active'];
        }
      }
    }

    if (!this.notNotification) {
      this.browserNotification
        .sendNotify(
          title,
          // <NotificationOptions>{ body: contentFinnal, icon: `https://ui.b3networks.com/external/icon/workspace_128.png` }, // hardcoding for whatsapp first
          <NotificationOptions>{
            body: contentFinnal,
            icon: `https://ui.b3networks.com/external/icon/unified_workspace_128.png`
          }, // hardcoding for whatsapp first
          routerLink
        )
        .subscribe();
    }
  }

  private getActiveByChannel(convo: SupportedConvo) {
    return convo instanceof Channel
      ? this.channelQuery.getActiveId()
      : convo instanceof ChannelHyperspace
      ? this.channelHyperspaceQuery.getActiveId()
      : this.convoGroupQuery.getActiveId();
  }

  private getMessageNotificationContent(msg: ChatMessage, conversation?: SupportedConvo, user?: User): string {
    const text =
      msg.mt === MsgType.email
        ? this.getEmailMsgContent(msg)
        : msg.body?.title
        ? msg.body.title
        : msg.body?.text
        ? msg.body.text
        : !msg.body.data
        ? ''
        : msg.body.data?.text
        ? msg.body.data.text
        : '';

    // text = this.htmlToPlaintext(text);
    let newMsg: string = this.preProcessingForNotify(text);

    if (newMsg) {
      // replace show notification has html tags
      newMsg = newMsg.replace(/<(?:.|\n)*?>/gm, '');
      newMsg = _.unescape(newMsg);

      if (conversation && conversation instanceof Channel && user) {
        newMsg = `@${user.displayName}: ${newMsg}`;
      }

      if (newMsg.length > 50) {
        newMsg = newMsg.slice(0, 50) + '...';
      }
    }

    return newMsg;
  }

  private getEmailMsgContent(msg: ChatMessage): string {
    if (msg.body.data) {
      return `Subject: ${msg.body.data.subject}\n${msg.body.data.text}`;
    }
    return '';
  }

  private preProcessingForNotify(message: string): string {
    if (!message) {
      return null;
    }

    const matchedArr: Match[] = [];

    let output: string = JSON.parse(JSON.stringify(message));
    const mentionMatched = message.match(RegExpPattern.MENTION);

    if (mentionMatched) {
      mentionMatched.filter(item => {
        const replaceString: string = randomGuid();
        matchedArr.push(new Match(MatchType.MENTION, item, replaceString));
        output = output.replace(item, replaceString);
      });
    }

    matchedArr.filter(item => {
      let replaceItem: string = item.matched;

      if (item.type === MatchType.MENTION) {
        const searchString: string = item.matched
          .slice(item.matched.indexOf('@') + 1, item.matched.length)
          .replace('>', '');

        if (searchString === 'everyone') {
          replaceItem = '@everyone';
        } else {
          const member = this.userQuery.getUserByChatUuid(searchString);
          if (member) {
            replaceItem = `@${member.displayName}`;
          } else {
            replaceItem = item.matched;
          }
        }
      }

      output = output.replace(item.replaceString, replaceItem);
    });

    return output;
  }

  private updateTyping(convo: SupportedConvo, message: ChatMessage) {
    if (convo && this.meQuery.getMe().userUuid !== message.user) {
      const uiState = this.convoHelper.getUIState(convo);
      let userTypings = Object.assign([], uiState.userTypings);
      userTypings = userTypings.filter(
        (s: TypingState) =>
          s.userUuid.toLowerCase() !== message.user.toLowerCase() &&
          s.startAtMillis + MessageConstants.TYPING > this.timeService.nowInMillis()
      );
      userTypings.push(new TypingState(message.user, message.ts));

      this.convoHelper.updateUIState(convo, <ViewUIStateCommon>{
        userTypings: userTypings
      });
    }
  }

  private _updateConvo(convo: SupportedConvo, res: SupportedConvo) {
    if (convo) {
      if (convo instanceof Channel) {
        runEntityStoreAction(ChatChannelStoreName, EntityStoreAction.UpdateEntities, update => update(convo.id, res));
      } else if (convo instanceof ConversationGroup) {
        runEntityStoreAction(ConvoGroupStoreName, EntityStoreAction.UpdateEntities, update => update(convo.id, res));
      } else if (convo instanceof ChannelHyperspace) {
        runEntityStoreAction(ChatChannelHyperspaceStoreName, EntityStoreAction.UpdateEntities, update =>
          update(convo.id, res)
        );
      }
    }
  }

  private addConversation2Store(message: ChatMessage) {
    const data = message.body?.data as TxnMessageData;
    let rootConvo = this.convoGroupQuery.getConvo(message.convo);
    if (!rootConvo) {
      rootConvo = new ConversationGroup(<Partial<ConversationGroup>>{
        conversationGroupId: message.convo,
        conversations: [
          {
            conversationId: message.convo,
            conversationType: ConversationType.public,
            members: []
          }
        ],
        customerInfo: <CustomerInfo>{
          uuid: data?.customer?.uuid,
          name: data?.customer?.displayName
        },
        createdAt: new Date(),
        status: data?.type !== SystemMsgType.archived ? Status.opened : Status.archived,
        type: GroupType.Customer
      });
      this.convoGroupService.addConversation2Store(rootConvo);
    }

    if (data) {
      let customerConvo = this.convoGroupQuery.getEntity(data.txnUuid);
      if (!customerConvo) {
        customerConvo = new ConversationGroup(<Partial<ConversationGroup>>{
          conversationGroupId: data.txnUuid,
          conversations: [
            {
              conversationId: data.txnUuid,
              conversationType: ConversationType.public,
              members: []
            }
          ],
          customerInfo: <CustomerInfo>{
            uuid: data?.customer?.uuid,
            name: data?.customer?.displayName
          },
          createdAt: new Date(),
          status: data?.type !== SystemMsgType.archived ? Status.opened : Status.archived,
          type: GroupType.Customer
        });

        this.convoGroupService.addConversation2Store(customerConvo);
      }
    }

    return rootConvo;
  }
}
